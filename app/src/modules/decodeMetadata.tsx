
import { deserializeUnchecked, BinaryReader, BinaryWriter } from "borsh";
import base58 from "bs58";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";

export const decodeMetadata = (buffer: Buffer): Metadata => {
    const metadata = deserializeUnchecked(
      METADATA_SCHEMA,
      Metadata,
      buffer
    ) as Metadata;
  
    // Remove any trailing null characters from the deserialized strings
    metadata.data.name = metadata.data.name.replace(/\0/g, "");
    metadata.data.symbol = metadata.data.symbol.replace(/\0/g, "");
    metadata.data.uri = metadata.data.uri.replace(/\0/g, "");
    metadata.data.name = metadata.data.name.replace(/\0/g, "");
    return metadata;
  };

  export enum MetadataKey {
    Uninitialized = 0,
    MetadataV1 = 4,
    EditionV1 = 1,
    MasterEditionV1 = 2,
    MasterEditionV2 = 6,
    EditionMarker = 7,
  }
  export type StringPublicKey = string;

  

  export class Metadata {
    key: MetadataKey;
    updateAuthority: StringPublicKey;
    mint: StringPublicKey;
    data: Data;
    primarySaleHappened: boolean;
    isMutable: boolean;
    editionNonce: number | null;
  
    constructor(args: {
      updateAuthority: StringPublicKey;
      mint: StringPublicKey;
      data: Data;
      primarySaleHappened: boolean;
      isMutable: boolean;
      editionNonce: number | null;
    }) {
      this.key = MetadataKey.MetadataV1;
      this.updateAuthority = args.updateAuthority;
      this.mint = args.mint;
      this.data = args.data;
      this.primarySaleHappened = args.primarySaleHappened;
      this.isMutable = args.isMutable;
      this.editionNonce = args.editionNonce;
    }
  }
  export class Data {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
    constructor(args: {
      name: string;
      symbol: string;
      uri: string;
      sellerFeeBasisPoints: number;
      creators: Creator[] | null;
    }) {
      this.name = args.name;
      this.symbol = args.symbol;
      this.uri = args.uri;
      this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
      this.creators = args.creators;
    }
  }
  export class Creator {
    address: StringPublicKey;
    verified: boolean;
    share: number;
  
    constructor(args: {
      address: StringPublicKey;
      verified: boolean;
      share: number;
    }) {
      this.address = args.address;
      this.verified = args.verified;
      this.share = args.share;
    }
  }

  export class Dummy {
      name: string;
      constructor(args: {
          name: string
      }) {
          this.name = args.name
      }
  }

  export const METADATA_SCHEMA = new Map<any, any>([
    [
        Dummy,
      {
        kind: "struct",
      }
    ],
    [
        Dummy,
      {
        kind: "struct",
      }
    ],
    [
        Dummy,
      {
        kind: "struct",
      }
    ],
    [
      Data,
      {
        kind: "struct",
        fields: [
          ["name", "string"],
          ["symbol", "string"],
          ["uri", "string"],
          ["sellerFeeBasisPoints", "u16"],
          ["creators", { kind: "option", type: [Creator] }],
        ],
      },
    ],
    [
      Creator,
      {
        kind: "struct",
        fields: [
          ["address", "pubkeyAsString"],
          ["verified", "u8"],
          ["share", "u8"],
        ],
      },
    ],
    [
      Metadata,
      {
        kind: "struct",
        fields: [
          ["key", "u8"],
          ["updateAuthority", "pubkeyAsString"],
          ["mint", "pubkeyAsString"],
          ["data", Data],
          ["primarySaleHappened", "u8"], // bool
          ["isMutable", "u8"], // bool
        ],
      },
    ],
    [
        Dummy,
      {
        kind: "struct",
      }
    ],
  ]);

  // Required to properly serialize and deserialize pubKeyAsString types
const extendBorsh = () => {
    (BinaryReader.prototype as any).readPubkey = function () {
      const reader = this as unknown as BinaryReader;
      const array = reader.readFixedArray(32);
      return new PublicKey(array);
    };
  
    (BinaryWriter.prototype as any).writePubkey = function (value: any) {
      const writer = this as unknown as BinaryWriter;
      writer.writeFixedArray(value.toBuffer());
    };
  
    (BinaryReader.prototype as any).readPubkeyAsString = function () {
      const reader = this as unknown as BinaryReader;
      const array = reader.readFixedArray(32);
      return base58.encode(array) as StringPublicKey;
    };
  
    (BinaryWriter.prototype as any).writePubkeyAsString = function (
      value: StringPublicKey
    ) {
      const writer = this as unknown as BinaryWriter;
      writer.writeFixedArray(base58.decode(value));
    };
  };
  
  extendBorsh();