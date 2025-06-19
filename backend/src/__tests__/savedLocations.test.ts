import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
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

describe("Saved Locations API", () => {
  let userId: string;
  const sampleLoc = {
    id: "rome-italy",
    name: "Rome, Italy",
    lat: 41.9028,
    lon: 12.4964,
  };

  beforeEach(async () => {
    const user = await new User({
      name: "Tester",
      email: "tester@example.com",
      password: "secret",
    }).save();
    userId = user.id;
  });

  it("GET /api/users/:userId/saved-locations → initially empty", async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/saved-locations`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  it("POST /api/users/:userId/saved-locations → adds a location", async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send(sampleLoc)
      .expect(201);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject(sampleLoc);

    const getRes = await request(app)
      .get(`/api/users/${userId}/saved-locations`)
      .expect(200);
    expect(getRes.body).toHaveLength(1);
    expect(getRes.body[0]).toMatchObject(sampleLoc);
  });

  it("POST rejects duplicates (409)", async () => {
    await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send(sampleLoc)
      .expect(201);
    const res = await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send(sampleLoc)
      .expect(400);

    expect(res.body).toHaveProperty("error", "Location already saved");
  });

  it("POST enforces max 5 locations (400)", async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app)
        .post(`/api/users/${userId}/saved-locations`)
        .send({
          id: `loc${i}`,
          name: `Place ${i}`,
          lat: 0 + i,
          lon: 0 - i,
        })
        .expect(201);
    }
    const res = await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send({
        id: "loc6",
        name: "Place 6",
        lat: 6,
        lon: -6,
      })
      .expect(400);
    expect(res.body).toHaveProperty("error", "Max 5 saved locations");
  });

  it("DELETE /api/users/:userId/saved-locations/:locId → removes a location", async () => {
    await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send({ id: "a", name: "A", lat: 1, lon: 1 })
      .expect(201);
    await request(app)
      .post(`/api/users/${userId}/saved-locations`)
      .send({ id: "b", name: "B", lat: 2, lon: 2 })
      .expect(201);

    const delRes = await request(app)
      .delete(`/api/users/${userId}/saved-locations/a`)
      .expect(200);
    expect(delRes.body).toHaveLength(1);
    expect(delRes.body[0]).toMatchObject({ id: "b", name: "B" });

    const getRes = await request(app)
      .get(`/api/users/${userId}/saved-locations`)
      .expect(200);
    expect(getRes.body).toHaveLength(1);
    expect(getRes.body[0]).toMatchObject({ id: "b", name: "B" });
  });
});
