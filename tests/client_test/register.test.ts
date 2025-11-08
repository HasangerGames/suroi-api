/*************
* Important! The auth client in ./client is gitignore'd
* for IP safety reasons. Please ask hasanger for access
* privately!
*************/

import {expect, test} from "bun:test"
import AuthClient from './client/index'
import type {
    AuthObject,
    AuthChange
} from "./client/auth";

const SALT_LEN  = 16,
      ST_LEN    = 64;

const API_URL = "http://localhost:8300"
const TEST_USERNAME = "example_user"
const TEST_EMAIL = "example@example.com"
const TEST_PASSWORD = "verystrongpassword"

let auth = await AuthClient.getAuth();

test("Test registration api (this shouldn't work twice)", async () => {
    let salt = (await fetch(API_URL + "/api/user/register/saltshaker").then(res => res.json()))["salt"];
    // Build a test tree
    let saltu8 = Uint8Array.fromBase64(salt);

    // Empty st token for registration (all zeroes)
    let st = new Uint8Array(ST_LEN);

    let authObj: AuthObject = auth.buildAuthObject(TEST_USERNAME + ":" + TEST_PASSWORD, saltu8);
    let authData = auth.getAuthData(authObj, st, saltu8);

    // Try to register
    let payload = {
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "salt": salt,
        "w": Buffer.from(authData.w).toString("base64"),
        "sh": authData.selectedHashes.map((h) => {return Buffer.from(h).toString("base64")}),
        "ih": authData.intermediateHashes.map((h) => {return Buffer.from(h).toString("base64")})
    }
    let result = await fetch(API_URL + "/api/user/register/", {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json"
        },
        "body": JSON.stringify(payload)
    });
    console.log("If this warns about a duplicate user, that is also OK:");
    console.log(await result.text());
    expect(result.status).toBe(200);
});