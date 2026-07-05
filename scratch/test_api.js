const http = require('http');

const request = (url, options, body) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function run() {
  try {
    console.log('1. Logging in...');
    const loginRes = await request('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'testuser@gmail.com',
      password: 'password123'
    });

    console.log('Login Status:', loginRes.statusCode);
    console.log('Login Body:', loginRes.body);

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token;

    console.log('2. Fetching posts...');
    const postsRes = await request('http://localhost:5000/api/posts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Posts Status:', postsRes.statusCode);
    const posts = JSON.parse(postsRes.body);
    console.log(`Fetched ${posts.length} posts.`);

    const myPost = posts.find(p => p.text.includes('Test Custom Modals') || p.text.includes('Test post'));
    if (!myPost) {
      console.log('No own post found to test edit/delete on.');
      return;
    }

    console.log('Found post:', myPost._id, myPost.text);

    console.log(`3. Testing PUT /api/posts/${myPost._id}`);
    const putRes = await request(`http://localhost:5000/api/posts/${myPost._id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {
      text: 'Test Custom Modals - Edited via Script!'
    });

    console.log('PUT Status:', putRes.statusCode);
    console.log('PUT Headers:', putRes.headers);
    console.log('PUT Body:', putRes.body);

  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();
