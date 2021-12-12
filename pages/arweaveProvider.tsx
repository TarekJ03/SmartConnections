import { createContext } from "react";
import Arweave from "arweave";

export const arweaveContext = createContext({arweave: Arweave.init({})})