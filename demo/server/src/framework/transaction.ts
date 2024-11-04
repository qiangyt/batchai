import 'reflect-metadata';
import { Kontext } from './kontext';

interface TransactionOptions {
  readOnly: boolean;
  //isolationLevel?: IsolationLevel;
  //useSavepoint?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Transactional(options?: TransactionOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    let indexOfKontext = -1; //types.findIndex((type: any) => type.name === 'Kontext');
    types.forEach((type: any, index: number) => {
      if (type.name === 'Kontext') {
        indexOfKontext = index;
      }
    });
    if (indexOfKontext < 0) {
      throw new Error(`${method.name}: missing Kontext argument`);
    }

    descriptor.value = async function (...args: any[]) {
      let x: Kontext = args[indexOfKontext];
      if (!x) {
        if (this.dataSource) {
          args[indexOfKontext] = x = new Kontext(this.dataSource);
        } else {
          throw new Error(`${method.name}: no kontext instance`);
        }
      }

      if (x.queryRunner) {
        return await method.apply(this, args);
      }

      const qr = (x.queryRunner = x.dataSource.createQueryRunner());
      await qr.connect();
      await qr.startTransaction();

      //if (options && options.readOnly) {
      //  await qr.query('SET TRANSACTION READ ONLY');
      //}

      try {
        const result = await method.apply(this, args);
        await qr.commitTransaction();
        return result;
      } catch (err) {
        await qr.rollbackTransaction();
        throw err;
      } finally {
        x.queryRunner = null;
        await qr.release();
      }
    };
    return descriptor;
  };
}
