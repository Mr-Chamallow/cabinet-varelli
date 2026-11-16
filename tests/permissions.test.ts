// Tests des droits : lancer avec `npm test`
import { test } from "node:test";
import assert from "node:assert/strict";
import { getPermLevel, hasPermission, hasWriteAccess, isReadOnlyRole } from "../lib/permissions.ts";

test("sans utilisateur, aucun droit", () => {
  assert.equal(getPermLevel(null, "obsidian_stocks"), "none");
  assert.equal(getPermLevel(undefined, "obsidian_stocks"), "none");
  assert.equal(hasPermission(null, "obsidian_stocks"), false);
});

test("un nom de rôle en texte n'ouvre rien (seules les permissions comptent)", () => {
  assert.equal(getPermLevel("CEO", "obsidian_stocks"), "none");
  assert.equal(hasPermission("Patron", "admin"), false);
});

test("une entrée sans suffixe donne l'écriture", () => {
  const u = { permissions: ["obsidian_stocks"] };
  assert.equal(getPermLevel(u, "obsidian_stocks"), "write");
  assert.equal(hasWriteAccess(u, "obsidian_stocks"), true);
});

test("':read' donne la lecture seule", () => {
  const u = { permissions: ["obsidian_stocks:read"] };
  assert.equal(getPermLevel(u, "obsidian_stocks"), "read");
  assert.equal(hasPermission(u, "obsidian_stocks"), true);
  assert.equal(hasWriteAccess(u, "obsidian_stocks"), false);
});

test("l'écriture l'emporte si lecture et écriture existent", () => {
  const u = { permissions: ["obsidian_stocks:read", "obsidian_stocks:write"] };
  assert.equal(getPermLevel(u, "obsidian_stocks"), "write");
  const v = { permissions: ["obsidian_stocks", "obsidian_stocks:read"] };
  assert.equal(getPermLevel(v, "obsidian_stocks"), "write");
});

test("la permission 'admin' donne l'écriture partout", () => {
  const u = { permissions: ["admin"] };
  assert.equal(hasWriteAccess(u, "obsidian_taxes"), true);
  assert.equal(hasWriteAccess(u, "cabinet_journal"), true);
});

test("une permission voisine ne suffit pas (pas de correspondance partielle)", () => {
  const u = { permissions: ["obsidian_stocks"] };
  assert.equal(getPermLevel(u, "obsidian_stock"), "none");
  assert.equal(getPermLevel(u, "obsidian"), "none");
});

test("carte enquêteur en lecture seule", () => {
  assert.equal(isReadOnlyRole({ permissions: ["carte-enqueteur:read"] }), true);
  assert.equal(isReadOnlyRole({ permissions: ["carte-enqueteur"] }), false);
});

test("accepte aussi la session brute (champ permissions null)", () => {
  assert.equal(hasPermission({ permissions: null }, "obsidian_stocks"), false);
});
