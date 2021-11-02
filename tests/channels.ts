import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Channels } from "../target/types/channels";

describe("channels", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Channels as Program<Channels>;

  // it('Is initialized!', async () => {
  //   // Add your test here.
  //   const tx = await program.rpc.initialize({});
  //   console.log("Your transaction signature", tx);
  // });
});
