import {Stack, StackProps,} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import DietaAnoMesSubstack from "./dieta/dieta-anomes.substack";
import DietaDetalleSubStack from "./dieta/dieta-detalle.substack";
import GastosOperacionalesSubstack from "./dieta/gastos-operacionales.substack";

export class SenadoClStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const openDataBucket = new Bucket(this, 'openDataBucket', {
      bucketName: 'open-data-senado-cl'
    });

    const commonsLy = new LayerVersion(this, 'commons-ly', {
      layerVersionName: 'commons-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../packages/Commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperLy = new LayerVersion(this, 'scraper-ly', {
      layerVersionName: 'scraper-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../layers/scraper'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const dietaAnoMesStack = new DietaAnoMesSubstack(this, 'dietaAnoMes-stack', {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const dietaDetalleStack = new DietaDetalleSubStack(this, 'dietaDetalle-stack', {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const gastosOpeStack = new GastosOperacionalesSubstack(this, 'gastosOpe-stack', {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });
  }
}
