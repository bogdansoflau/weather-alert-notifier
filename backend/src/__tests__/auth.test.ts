import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../app";
import { User } from "../models/User";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: "testdb" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/auth/register", () => {
  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "pass123" })
      .expect(201);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
    });

    const dbUser = await User.findOne({ email: "alice@example.com" });
    expect(dbUser).not.toBeNull();
  });

  it("rejects duplicate emails", async () => {
    await new User({
      name: "Bob",
      email: "bob@example.com",
      password: "pw",
    }).save();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bobby", email: "bob@example.com", password: "pw2" })
      .expect(409);

    expect(res.body).toHaveProperty("message", "Email already in use");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await new User({
      name: "Carol",
      email: "carol@example.com",
      password: "xyz",
    }).save();
  });

  it("logs in valid users", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "carol@example.com", password: "xyz" })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: "Carol",
      email: "carol@example.com",
    });

    const payload = jwt.verify(
      res.body.token,
      process.env.JWT_SECRET as string
    ) as any;
    expect(payload).toHaveProperty("id");
  });

  it("rejects invalid credentials", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "carol@example.com", password: "wrong" })
      .expect(401);
  });
});
