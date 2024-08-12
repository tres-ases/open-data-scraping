import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {AwsIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import {PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {SenadoresBucketKey} from "@senado-cl/global/senadores";

const prefix = 'senado-cl-admin-api-endpoints';

interface AdminApiEndpointsSubstackProps {
  api: RestApi
  bucket: Bucket
}

export default class AdminApiEndpointsSubstack extends NestedStack {

  constructor(scope: Construct, {api, bucket}: AdminApiEndpointsSubstackProps) {
    super(scope, prefix);

    const readRole = new Role(this, `${prefix}-readRole`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
    });
    readRole.addToPolicy(new PolicyStatement({
      resources: [`${bucket.bucketArn}/*`],
      actions: ['s3:GetObject']
    }))

    api.root
      .addResource('senadores')
      .addMethod('GET', new AwsIntegration({
          service: 's3',
          path: `${bucket.bucketName}/${SenadoresBucketKey.periodoJsonStructured}`,
          integrationHttpMethod: 'GET',
          options: {
            credentialsRole: readRole,
            integrationResponses: [{
              statusCode: "200"
            }]
          }
        })
      );
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1] // will be the exact id of the stack
    }
    return super.getLogicalId(element)
  }
}
