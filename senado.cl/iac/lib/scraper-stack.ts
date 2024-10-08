import {CfnElement, Stack, StackProps,} from 'aws-cdk-lib';
import {Architecture, Code, LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import {MainBucketKey} from "@senado-cl/global/config";
import LegislaturasSubstack from "./substacks/legislaturas.substack";

export class ScraperStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const openDataBucket = new Bucket(this, 'openDataBucket', {
      bucketName: MainBucketKey.S3_BUCKET
    });

    const commonsLy = new LayerVersion(this, 'commons-ly', {
      layerVersionName: 'commons-ly',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../../commons/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const globalLy = new LayerVersion(this, 'global-ly', {
      layerVersionName: 'global-layer',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../global/layer'),
      compatibleArchitectures: [
        Architecture.X86_64
      ]
    });

    const scraperCommonsLy = new LayerVersion(this, 'senado-scraper-commons-ly', {
      layerVersionName: 'senado-scraper-commons-ly',
      compatibleRuntimes: [
        Runtime.NODEJS_20_X
      ],
      code: Code.fromAsset('../scraper/Commons/layer'),
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

    const legislaturasStack = new LegislaturasSubstack(this, {
      bucket: openDataBucket,
      layers: [scraperCommonsLy, scraperLy, globalLy, commonsLy]
    });
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
