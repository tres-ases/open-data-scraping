import {Construct} from "constructs";
import {CfnElement, NestedStack,} from 'aws-cdk-lib';
import {LayerVersion} from "aws-cdk-lib/aws-lambda";
import {IBucket} from "aws-cdk-lib/aws-s3";
import {StateMachine} from "aws-cdk-lib/aws-stepfunctions";
import AdminWorkflowLegSesGetDistillSubstackSubstack from "./workflows/admin-workflow-leg-ses-get-distill.substack";
import AdminWorkflowSenListGetRawSubstack from "./workflows/admin-workflow-sen-list-get-raw.substack";
import AdminWorkflowProyListGetRawSubstack from "./workflows/admin-workflow-proy-list-get-raw.substack";
import AdminWorkflowProyMapDtlSubstack from "./workflows/admin-workflow-proy-map-dtl.substack";
import AdminWorkflowPartMapDtlSubstack from "./workflows/admin-workflow-part-map-dtl.substack";

const prefix = 'senado-cl-workflows';

interface AdminApiWorkflowsSubstackProps {
  layers: LayerVersion[]
  dataBucket: IBucket
}

export default class AdminWorkflowsSubstack extends NestedStack {

  readonly legSesGetSaveWf: StateMachine;

  constructor(scope: Construct, {layers, dataBucket}: AdminApiWorkflowsSubstackProps) {
    super(scope, prefix);

    const partMapDtlWf = new AdminWorkflowPartMapDtlSubstack(this, {layers, dataBucket});

    const senListGetRawWf = new AdminWorkflowSenListGetRawSubstack(this, {
      layers, dataBucket,
      partMapDtlQueue: partMapDtlWf.queue
    });

    const proyDistillWf = new AdminWorkflowProyMapDtlSubstack(this, {layers, dataBucket});
    const proyListGetRawWf = new AdminWorkflowProyListGetRawSubstack(this, {
      layers, dataBucket,
      proyDistillQueue: proyDistillWf.queue
    });

    const legSesGetDistillWf = new AdminWorkflowLegSesGetDistillSubstackSubstack(this, {
      dataBucket,
      layers,
      senSlugQueue: senListGetRawWf.queue,
      proyBolIdQueue: proyListGetRawWf.queue,
    });
    this.legSesGetSaveWf = legSesGetDistillWf.stateMachine;
  }

  getLogicalId(element: CfnElement): string {
    if (element.node.id.includes('NestedStackResource')) {
      try {
        return /([a-zA-Z0-9]+)\.NestedStackResource/.exec(element.node.id)![1]
      } catch (e) {
      }
    }
    return super.getLogicalId(element)
  }
}
