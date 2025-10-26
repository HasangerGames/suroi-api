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

let auth = await AuthClient.getAuth();

test("Basic sanity check [valid PoW]", async () => {
    // Build a test tree
    let salt = new Uint8Array(SALT_LEN);
    // Simple salt
    for(var i = 0; i < salt.length; i++) salt[i] = i + 1;

    // Simple ST token
    let st = new Uint8Array(ST_LEN);

    let authObj: AuthObject = auth.buildAuthObject("Bob:Bob123", salt);
    let authData = auth.getAuthData(authObj, st, salt);

    // unnecessary in prod, this is just for testing purposes
    let rpu8 = new Uint8Array(authObj.rp.size());
    for(var i = 0; i < authObj.rp.size(); i++) rpu8[i] = authObj.rp.get(i);

    // Test against the auth module
    let payload = {
        "s_rp": Buffer.from(rpu8).toString('base64'),
        "s_st": Buffer.from(st).toString("base64"),
        "s_salt": Buffer.from(salt).toString("base64"),
        "w": Buffer.from(authData.w).toString("base64"),
        "sh": authData.selectedHashes.map((h) => {return Buffer.from(h).toString("base64")}),
        "ih": authData.intermediateHashes.map((h) => {return Buffer.from(h).toString("base64")})
    }
    console.log(await (await fetch("http://localhost:6969/authenticate", {
        "method": "POST",
        "body": JSON.stringify(payload)
    })).text());
});