import { jest } from '@jest/globals';
// tests/authController.test.js
import { makeReq, makeRes } from "./test-helpers.js";

// ---- Mock external deps used inside AuthController ----
jest.mock("../src/config/db.js", () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));
jest.mock("jsonwebtoken", () => ({
  __esModule: true,
  sign: jest.fn(),
  verify: jest.fn(),
}));
jest.mock("bcrypt", () => ({
  __esModule: true,
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("crypto", () => {
  const real = jest.requireActual("crypto");
  return { __esModule: true, ...real, randomBytes: jest.fn() };
});
jest.mock("../models/userModel.js", () => ({
  __esModule: true,
  UserModel: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.mock("../utils/sendEmail.js", () => ({
  __esModule: true,
  sendEmail: jest.fn(),
}));

import pool from "../src/config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { UserModel } from "../src/models/userModel.js";
import { sendEmail } from "../src/utils/sendEmail.js";
import { AuthController } from "../src/controllers/authController.js";

const fixedNow = new Date("2025-01-01T12:00:00.000Z");
const asDate = (s) => new Date(s);

describe("AuthController", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fixedNow);
    jest.clearAllMocks();
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    process.env.API_TOKEN_EXPIRATION = process.env.API_TOKEN_EXPIRATION || "3600";
    process.env.EMAIL_TOKEN_EXPIRATION = process.env.EMAIL_TOKEN_EXPIRATION || "86400";
  });

  afterAll(() => jest.useRealTimers());

  // ---------------------------------------------------
  // login
  // ---------------------------------------------------
  describe("login", () => {
    test("idempotent login with valid Bearer token → 200 Already logged in", async () => {
      const incomingToken = "valid.jwt";
      const req = makeReq({ auth: `Bearer ${incomingToken}` });
      const res = makeRes();

      jwt.verify.mockReturnValue({ id: 1, role: "user" });
      const dbExpires = asDate("2025-01-01T13:00:00.000Z");
      // SELECT user_tokens ... LIMIT 1
      pool.query.mockResolvedValueOnce([[{ user_id: 1, token: incomingToken, expires_at: dbExpires }]]);
      // findById to enrich response
      UserModel.findById.mockResolvedValue({
        id: 1, user_name: "testuser", email_address: "test@example.com", role: "user",
      });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Already logged in",
        token: incomingToken,
        expires_at: dbExpires,
        user: {
          id: 1,
          user_name: "testuser",
          email_address: "test@example.com",
          role: "user",
        },
      });
    });

    test("Bearer provided but invalid → falls through to normal login", async () => {
      const req = makeReq({
        auth: "Bearer bad.token",
        body: { email_address: "u@example.com", password: "ok" },
      });
      const res = makeRes();

      // make jwt.verify throw so it falls back
      jwt.verify.mockImplementation(() => { throw new Error("jwt expired"); });

      // Normal login mocks
      UserModel.findByEmail.mockResolvedValue({
        id: 1, status: "active", password_hash: "hash", role: "user",
        user_name: "u", email_address: "u@example.com",
      });
      bcrypt.compare.mockResolvedValue(true);
      // No active session
      pool.query
        .mockResolvedValueOnce([[]])       // SELECT active session -> none
        .mockResolvedValueOnce([{}])       // DELETE old api_access tokens
        .mockResolvedValueOnce([{}])       // INSERT new api_access token
        .mockResolvedValueOnce([{}]);      // UPDATE last_login_at

      jwt.sign.mockReturnValue("new.jwt");

      await AuthController.login(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Login successful",
        token: "new.jwt",
      }));
    });

    test("404 when user not found", async () => {
      const req = makeReq({ body: { email_address: "missing@example.com", password: "x" } });
      const res = makeRes();

      UserModel.findByEmail.mockResolvedValue(null);

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("403 when user.status !== 'active'", async () => {
      const req = makeReq({ body: { email_address: "user@example.com", password: "x" } });
      const res = makeRes();

      UserModel.findByEmail.mockResolvedValue({
        id: 1, status: "pending", password_hash: "hash", role: "user",
      });

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: "Account is not active. Please verify your email or contact support.",
      });
    });

    test("401 when password invalid", async () => {
      const req = makeReq({ body: { email_address: "user@example.com", password: "bad" } });
      const res = makeRes();

      UserModel.findByEmail.mockResolvedValue({
        id: 1, status: "active", password_hash: "hash", role: "user",
      });
      bcrypt.compare.mockResolvedValue(false);

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
    });

    test("409 when user already has an active session", async () => {
      const req = makeReq({ body: { email_address: "user@example.com", password: "ok" } });
      const res = makeRes();

      UserModel.findByEmail.mockResolvedValue({
        id: 1, status: "active", password_hash: "hash", role: "user",
        user_name: "u", email_address: "user@example.com",
      });
      bcrypt.compare.mockResolvedValue(true);

      const activeExp = asDate("2025-01-01T13:00:00.000Z");
      pool.query.mockResolvedValueOnce([[{ token: "abc", created_at: fixedNow, expires_at: activeExp }]]);

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "User already logged in",
        code: "ALREADY_LOGGED_IN",
        session: { expires_at: activeExp },
      });
    });

    test("200 when issuing a new session token", async () => {
      const req = makeReq({ body: { email_address: "user@example.com", password: "ok" } });
      const res = makeRes();

      const user = {
        id: 1, status: "active", password_hash: "hash", role: "user",
        user_name: "u", email_address: "user@example.com",
      };
      UserModel.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      pool.query
        .mockResolvedValueOnce([[]])  // SELECT active session -> none
        .mockResolvedValueOnce([{}])  // DELETE old api_access
        .mockResolvedValueOnce([{}])  // INSERT new api_access
        .mockResolvedValueOnce([{}]); // UPDATE last_login_at

      jwt.sign.mockReturnValue("new.jwt.token");

      await AuthController.login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 1, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: `${parseInt(process.env.API_TOKEN_EXPIRATION, 10)}s` }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Login successful",
        token: "new.jwt.token",
        user: {
          id: 1,
          user_name: "u",
          email_address: "user@example.com",
          role: "user",
        },
      }));
    });

    test("500 on unexpected error path", async () => {
      const req = makeReq({ body: { email_address: "user@example.com", password: "ok" } });
      const res = makeRes();

      UserModel.findByEmail.mockRejectedValue(new Error("DB unavailable"));

      await AuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB unavailable" });
    });
  });

  // ---------------------------------------------------
  // logout
  // ---------------------------------------------------
  describe("logout", () => {
    test("401 when Authorization header missing", async () => {
      const req = makeReq();
      const res = makeRes();

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Authorization token missing" });
    });

    test("401 when token invalid/expired", async () => {
      const req = makeReq({ auth: "Bearer bad.token" });
      const res = makeRes();

      jwt.verify.mockImplementation(() => { throw new Error("jwt expired"); });

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    });

    test("404 when session not found", async () => {
      const req = makeReq({ auth: "Bearer good.token" });
      const res = makeRes();

      jwt.verify.mockReturnValue({ id: 1 });
      pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Session not found or already logged out",
        code: "SESSION_NOT_FOUND",
      });
    });

    test("200 on successful logout", async () => {
      const req = makeReq({ auth: "Bearer good.token" });
      const res = makeRes();

      jwt.verify.mockReturnValue({ id: 1 });
      pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await AuthController.logout(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Logout successful" });
    });
  });

  // ---------------------------------------------------
  // register
  // ---------------------------------------------------
  describe("register", () => {
    test("400 when required fields are missing", async () => {
      const req = makeReq({ body: { first_name: "A" } });
      const res = makeRes();

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing required fields" });
    });

    test("409 when email already registered", async () => {
      const body = {
        user_name: "u", first_name: "A", last_name: "B",
        email_address: "x@example.com", password: "Secret123!",
      };
      const req = makeReq({ body });
      const res = makeRes();

      pool.query.mockResolvedValueOnce([[{ id: 100 }]]); // SELECT users by email -> found

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: "Email already registered" });
    });

    test("201 registers, stores verification token, sends email", async () => {
      const body = {
        user_name: "u", first_name: "A", last_name: "B",
        email_address: "x@example.com", password: "Secret123!",
        preferences: { theme: "dark" },
      };
      const req = makeReq({ body });
      const res = makeRes();

      pool.query
        .mockResolvedValueOnce([[]])               // SELECT users by email -> none
        .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT users
        .mockResolvedValueOnce([{}]);              // INSERT email_verification token

      bcrypt.hash.mockResolvedValue("hashed_pw");
      crypto.randomBytes.mockReturnValue(Buffer.from("deadbeef", "hex"));

      await AuthController.register(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("Secret123!", 10);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail.mock.calls[0][0]).toBe("x@example.com");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message:
          "User registered successfully. Please check your email to verify your account.",
        user: {
          id: 42,
          user_name: "u",
          first_name: "A",
          last_name: "B",
          email_address: "x@example.com",
          role: "user",
          status: "pending",
        },
      });
    });

    test("500 on internal error", async () => {
      const req = makeReq({
        body: {
          user_name: "u", first_name: "A", last_name: "B",
          email_address: "x@example.com", password: "Secret123!",
        },
      });
      const res = makeRes();

      pool.query.mockRejectedValue(new Error("DB down"));

      await AuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });
  });

  // ---------------------------------------------------
  // verify
  // ---------------------------------------------------
  describe("verify", () => {
    test("400 when verification token not found", async () => {
      const req = makeReq({ query: { token: "abc" } });
      const res = makeRes();

      pool.query.mockResolvedValueOnce([[]]); // lookup email_verification

      await AuthController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    test("400 when verification token expired", async () => {
      const req = makeReq({ query: { token: "abc" } });
      const res = makeRes();

      const past = asDate("2024-01-01T00:00:00.000Z");
      pool.query.mockResolvedValueOnce([[{ user_id: 9, expires_at: past }]]);

      await AuthController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Token expired" });
    });

    test("200 verifies, activates user, issues api_access token", async () => {
      const req = makeReq({ query: { token: "abc" } });
      const res = makeRes();

      const future = asDate("2025-01-01T13:00:00.000Z");
      pool.query
        .mockResolvedValueOnce([[{ user_id: 9, expires_at: future }]]) // token lookup
        .mockResolvedValueOnce([{}])                                   // UPDATE users verified+active
        .mockResolvedValueOnce([{}])                                   // DELETE used token
        .mockResolvedValueOnce([{}]);                                  // INSERT api_access token

      jwt.sign.mockReturnValue("api.jwt.token");

      await AuthController.verify(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 9 },
        process.env.JWT_SECRET,
        { expiresIn: `${parseInt(process.env.API_TOKEN_EXPIRATION || "3600", 10)}s` }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Email verified successfully",
        token: "api.jwt.token",
      });
    });

    test("500 on unexpected error", async () => {
      const req = makeReq({ query: { token: "abc" } });
      const res = makeRes();

      pool.query.mockRejectedValue(new Error("DB error"));

      await AuthController.verify(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "DB error" });
    });
  });
});
