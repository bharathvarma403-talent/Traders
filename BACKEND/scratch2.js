const bcrypt = require('bcryptjs');

const hash = '$2b$12$rXa9O5AFV0qOcH1eZxUAWesl./TLz5E.b7IAb.fdEKfX8UMjn0A8G';
const plain = '000000';

bcrypt.compare(plain, hash).then(console.log);
