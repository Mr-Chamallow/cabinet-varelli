"use client";
import { useEffect } from "react";
// Le calendrier est intégré à la page Rendez-vous (onglet « Tout »).
export default function CalendrierRedirect() { useEffect(() => { window.location.replace("/obsidian/rdv"); }, []); return null; }
