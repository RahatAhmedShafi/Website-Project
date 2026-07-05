const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1. User Schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  university: { type: String, default: '' },
  district: { type: String, default: '' },
  skills: [{ type: String }],
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  followers: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  following: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  friends: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  friendRequests: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  sentFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'users' }]
}, { timestamps: true });

// 2. Post Schema
const PostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  text: { type: String, default: '' },
  image: { type: String, default: '' },
  community: { type: Schema.Types.ObjectId, ref: 'communities', default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  isNotice: { type: Boolean, default: false },
  noticeCategory: { type: String, default: '' } // Lost & Found, Event, Announcement
}, { timestamps: true });

// 3. Comment Schema
const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'posts', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  text: { type: String, required: true }
}, { timestamps: true });

// 4. Community Schema
const CommunitySchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  members: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true }
}, { timestamps: true });

// 5. Message Schema
const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// 6. Notification Schema
const NotificationSchema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  type: { type: String, required: true }, // 'like', 'comment', 'follow', 'system'
  post: { type: Schema.Types.ObjectId, ref: 'posts', default: null },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// 7. Blood Donor Schema
const BloodDonorSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  name: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  district: { type: String, required: true },
  phone: { type: String, required: true },
  available: { type: Boolean, default: true }
}, { timestamps: true });

// 8. Tuition Post Schema
const TuitionPostSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  type: { type: String, required: true }, // 'tutor_profile' or 'student_request'
  title: { type: String, required: true },
  subjects: [{ type: String }],
  district: { type: String, required: true },
  area: { type: String, default: '' },
  salary: { type: String, default: 'Negotiable' },
  details: { type: String, required: true },
  phone: { type: String, required: true }
}, { timestamps: true });

// 9. Job Schema
const JobSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  companyName: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true }, // 'Internship', 'Part-time', 'Remote', 'Full-time'
  description: { type: String, required: true },
  requirements: { type: String, required: true },
  salary: { type: String, default: 'Negotiable' },
  link: { type: String, default: '' }
}, { timestamps: true });

// Register models
const registerModels = () => {
  try {
    mongoose.model('users', UserSchema);
    mongoose.model('posts', PostSchema);
    mongoose.model('comments', CommentSchema);
    mongoose.model('communities', CommunitySchema);
    mongoose.model('messages', MessageSchema);
    mongoose.model('notifications', NotificationSchema);
    mongoose.model('blood_donors', BloodDonorSchema);
    mongoose.model('tuition_posts', TuitionPostSchema);
    mongoose.model('jobs', JobSchema);
    console.log('Mongoose models registered successfully.');
  } catch (err) {
    // Avoid overwrite errors in hot-reloads
    console.log('Mongoose models already registered.');
  }
};

module.exports = { registerModels };
