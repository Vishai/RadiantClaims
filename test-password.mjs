import bcrypt from "bcryptjs";

const password = "Password123!";
const hash = "$2a$10$DSkAzHd.zmlqDwG6szGzqeDa0m2/iFkXX7swmn4AcR77WYWGnc2e2";

const isValid = await bcrypt.compare(password, hash);
console.log("Password:", password);
console.log("Hash:", hash);
console.log("Is valid:", isValid);
