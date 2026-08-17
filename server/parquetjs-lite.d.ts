declare module "parquetjs-lite" {
  export const ParquetReader: any;
  export const ParquetWriter: any;
  export const ParquetSchema: any;
  const parquetjs: {
    ParquetReader: any;
    ParquetWriter: any;
    ParquetSchema: any;
  };
  export default parquetjs;
}
