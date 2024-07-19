import {CfnElement, Stack, StackProps,} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import DietaAnoMesSubstack from "./substacks/dieta-anomes.substack";
import DietaDetalleSubStack from "./substacks/dieta-detalle.substack";
import GastosOperacionalesSubstack from "./substacks/gastos-operacionales.substack";
import SenadoresSubstack from "./substacks/senadores.substack";
import VotacionesSubstack from "./substacks/votaciones.substack";

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

    const dietaAnoMesStack = new DietaAnoMesSubstack(this, {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const dietaDetalleStack = new DietaDetalleSubStack(this, {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const gastosOpeStack = new GastosOperacionalesSubstack(this, {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const senadoresStack = new SenadoresSubstack(this, {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });

    const votacionesStack = new VotacionesSubstack(this,  {
      bucket: openDataBucket,
      commonsLy, scraperLy
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
