const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Paths
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    users: [],
    posts: [],
    comments: [],
    likes: [],
    communities: [],
    messages: [],
    notifications: [],
    blood_donors: [],
    tuition_posts: [],
    jobs: [],
    notices: []
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
}

let isMongoConnected = false;

// Initialize Database connection
async function connectDB() {
  const mongoURI = process.env.MONGO_URI;
  if (mongoURI) {
    try {
      console.log('Attempting to connect to MongoDB Atlas...');
      await mongoose.connect(mongoURI);
      isMongoConnected = true;
      console.log('MongoDB Atlas Connected Successfully!');
    } catch (err) {
      console.error('MongoDB connection failed. Falling back to local JSON database.', err.message);
      isMongoConnected = false;
    }
  } else {
    console.log('No MONGO_URI provided in .env. Using local JSON database (backend/data/db.json).');
    isMongoConnected = false;
  }
}

// Low-level helper functions for local JSON DB
function readLocalDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading local db.json', e);
    return {};
  }
}

function writeLocalDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing to local db.json', e);
  }
}

// Generate unique string ID for mock items
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Generic database operations abstraction
const db = {
  isMongo: () => isMongoConnected,

  // Find multiple documents
  find: async (collection, query = {}, options = {}) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      let q = model.find(query);
      if (options.sort) q = q.sort(options.sort);
      if (options.limit) q = q.limit(options.limit);
      if (options.populate) q = q.populate(options.populate);
      return await q.lean();
    } else {
      const data = readLocalDB();
      let list = data[collection] || [];
      
      // Filter list based on query keys
      list = list.filter(item => {
        // Support $or array matching
        if (query.$or && Array.isArray(query.$or)) {
          const matchOr = query.$or.some(orQuery => {
            for (let key in orQuery) {
              const val = orQuery[key];
              if (val && typeof val === 'object' && !Array.isArray(val)) {
                if (val.$regex) {
                  const regex = new RegExp(val.$regex, val.$options || 'i');
                  if (regex.test(item[key] || '')) return true;
                }
              } else if (item[key] === val) {
                return true;
              }
            }
            return false;
          });
          if (!matchOr) return false;
        }

        for (let key in query) {
          if (key === '$or') continue;
          if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
            // Support simple search queries (e.g. $regex)
            if (query[key].$regex) {
              const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
              if (!regex.test(item[key] || '')) return false;
              continue;
            }
            if (query[key].$in) {
              if (!query[key].$in.includes(item[key])) return false;
              continue;
            }
          }
          if (item[key] !== query[key]) return false;
        }
        return true;
      });

      // Sort
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0];
        const sortOrder = options.sort[sortKey];
        list.sort((a, b) => {
          if (a[sortKey] < b[sortKey]) return sortOrder === -1 ? 1 : -1;
          if (a[sortKey] > b[sortKey]) return sortOrder === -1 ? -1 : 1;
          return 0;
        });
      }

      // Limit
      if (options.limit) {
        list = list.slice(0, options.limit);
      }

      // Populate simulation (e.g., populate 'user' by mapping user objects)
      if (options.populate) {
        const populateFields = Array.isArray(options.populate) ? options.populate : [options.populate];
        const localData = readLocalDB();
        list = list.map(item => {
          const newItem = { ...item };
          populateFields.forEach(field => {
            const fieldPath = typeof field === 'string' ? field : field.path;
            const refCollection = fieldPath === 'user' || fieldPath === 'author' || fieldPath === 'sender' || fieldPath === 'recipient' ? 'users' : 
                                  fieldPath === 'posts' || fieldPath === 'post' ? 'posts' : 
                                  fieldPath === 'comments' || fieldPath === 'comment' ? 'comments' : null;
            if (refCollection && newItem[fieldPath]) {
              const refId = newItem[fieldPath].toString();
              const refObj = (localData[refCollection] || []).find(r => r._id === refId);
              if (refObj) {
                // Return ref object but omit password for users
                const { password, ...safeObj } = refObj;
                newItem[fieldPath] = safeObj;
              }
            }
          });
          return newItem;
        });
      }

      return list;
    }
  },

  // Find single document
  findOne: async (collection, query = {}) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.findOne(query).lean();
    } else {
      const results = await db.find(collection, query);
      return results.length > 0 ? results[0] : null;
    }
  },

  // Find document by ID
  findById: async (collection, id) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.findById(id).lean();
    } else {
      const results = await db.find(collection, { _id: id.toString() });
      return results.length > 0 ? results[0] : null;
    }
  },

  // Create new document
  create: async (collection, docData) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      const newDoc = new model(docData);
      const saved = await newDoc.save();
      return saved.toObject();
    } else {
      const data = readLocalDB();
      const list = data[collection] || [];
      const newDoc = {
        _id: generateId(),
        ...docData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(newDoc);
      data[collection] = list;
      writeLocalDB(data);
      return newDoc;
    }
  },

  // Find document by ID and update it
  findByIdAndUpdate: async (collection, id, updateData, options = { new: true }) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.findByIdAndUpdate(id, updateData, options).lean();
    } else {
      const data = readLocalDB();
      const list = data[collection] || [];
      const index = list.findIndex(item => item._id === id.toString());
      if (index === -1) return null;

      const current = list[index];
      let updated;
      
      // Check if updateData uses Mongo operators (e.g. $push, $pull, $set)
      if (updateData.$push) {
        updated = { ...current };
        for (let key in updateData.$push) {
          updated[key] = Array.isArray(updated[key]) ? updated[key] : [];
          updated[key].push(updateData.$push[key]);
        }
      } else if (updateData.$pull) {
        updated = { ...current };
        for (let key in updateData.$pull) {
          if (Array.isArray(updated[key])) {
            updated[key] = updated[key].filter(val => val.toString() !== updateData.$pull[key].toString());
          }
        }
      } else if (updateData.$set) {
        updated = { ...current, ...updateData.$set, updatedAt: new Date().toISOString() };
      } else {
        updated = { ...current, ...updateData, updatedAt: new Date().toISOString() };
      }

      list[index] = updated;
      data[collection] = list;
      writeLocalDB(data);
      return updated;
    }
  },

  // Update multiple documents
  updateMany: async (collection, query, updateData) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.updateMany(query, updateData);
    } else {
      const data = readLocalDB();
      const list = data[collection] || [];
      let updatedCount = 0;
      
      const newList = list.map(item => {
        let matches = true;
        for (let key in query) {
          if (item[key] !== query[key]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          updatedCount++;
          return { ...item, ...updateData, updatedAt: new Date().toISOString() };
        }
        return item;
      });

      data[collection] = newList;
      writeLocalDB(data);
      return { nModified: updatedCount };
    }
  },

  // Delete a single document by ID
  findByIdAndDelete: async (collection, id) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.findByIdAndDelete(id).lean();
    } else {
      const data = readLocalDB();
      const list = data[collection] || [];
      const index = list.findIndex(item => item._id === id.toString());
      if (index === -1) return null;
      const deleted = list.splice(index, 1)[0];
      data[collection] = list;
      writeLocalDB(data);
      return deleted;
    }
  },

  // Delete many documents matching query
  deleteMany: async (collection, query) => {
    if (isMongoConnected) {
      const model = mongoose.model(collection);
      return await model.deleteMany(query);
    } else {
      const data = readLocalDB();
      const list = data[collection] || [];
      const beforeLength = list.length;
      const newList = list.filter(item => {
        for (let key in query) {
          if (item[key] !== query[key]) return true;
        }
        return false;
      });
      data[collection] = newList;
      writeLocalDB(data);
      return { deletedCount: beforeLength - newList.length };
    }
  }
};

module.exports = { connectDB, db };
