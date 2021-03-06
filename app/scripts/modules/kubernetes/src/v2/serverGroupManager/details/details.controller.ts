import { IController, IScope, module } from 'angular';
import { IModalService } from 'angular-ui-bootstrap';

import { Application, IManifest, IServerGroupManager, IServerGroupManagerStateParams, } from '@spinnaker/core';
import { IKubernetesServerGroupManager } from '../IKubernetesServerGroupManager';
import { KubernetesManifestService } from '../../manifest/manifest.service';

class KubernetesServerGroupManagerDetailsController implements IController {
  public serverGroupManager: IKubernetesServerGroupManager;
  public state = { loading: true };
  public manifest: IManifest;

  constructor(serverGroupManager: IServerGroupManagerStateParams,
              private $scope: IScope,
              private $uibModal: IModalService,
              private kubernetesManifestService: KubernetesManifestService,
              public app: Application) {
    'ngInject';

    this.kubernetesManifestService.makeManifestRefresher(this.app, this.$scope, {
      account: serverGroupManager.accountId,
      location: serverGroupManager.region,
      name: serverGroupManager.serverGroupManager,
    }, this);

    this.app.ready()
      .then(() => {
        this.extractServerGroupManager(serverGroupManager);
        this.state.loading = false;
      });
  }

  public pauseRolloutServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/rollout/pause.html'),
      controller: 'kubernetesV2ManifestPauseRolloutCtrl',
      controllerAs: 'ctrl',
      resolve: {
        coordinates: {
          name: this.serverGroupManager.name,
          namespace: this.serverGroupManager.namespace,
          account: this.serverGroupManager.account
        },
        application: this.app
      }
    });
  }

  public resumeRolloutServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/rollout/resume.html'),
      controller: 'kubernetesV2ManifestResumeRolloutCtrl',
      controllerAs: 'ctrl',
      resolve: {
        coordinates: {
          name: this.serverGroupManager.name,
          namespace: this.serverGroupManager.namespace,
          account: this.serverGroupManager.account
        },
        application: this.app
      }
    });
  }

  public canUndoRolloutServerGroupManager(): boolean {
    return this.serverGroupManager.serverGroups && this.serverGroupManager.serverGroups.length > 0;
  }

  public undoRolloutServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/rollout/undo.html'),
      controller: 'kubernetesV2ManifestUndoRolloutCtrl',
      controllerAs: 'ctrl',
      resolve: {
        coordinates: {
          name: this.serverGroupManager.name,
          namespace: this.serverGroupManager.namespace,
          account: this.serverGroupManager.account
        },
        revisions: () => this.serverGroupManager.serverGroups.map((sg) => {
          return {
            name: sg.name,
            revision: sg.moniker.sequence,
          };
        }),
        application: this.app
      }
    });
  }

  public scaleServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/scale/scale.html'),
      controller: 'kubernetesV2ManifestScaleCtrl',
      controllerAs: 'ctrl',
      resolve: {
        coordinates: {
          name: this.serverGroupManager.name,
          namespace: this.serverGroupManager.namespace,
          account: this.serverGroupManager.account
        },
        currentReplicas: this.serverGroupManager.manifest.spec.replicas,
        application: this.app
      }
    });
  }

  public editServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/wizard/manifestWizard.html'),
      size: 'lg',
      controller: 'kubernetesV2ManifestEditCtrl',
      controllerAs: 'ctrl',
      resolve: {
        sourceManifest: this.serverGroupManager.manifest,
        sourceMoniker: this.serverGroupManager.moniker,
        application: this.app
      }
    });
  }

  public deleteServerGroupManager(): void {
    this.$uibModal.open({
      templateUrl: require('../../manifest/delete/delete.html'),
      controller: 'kubernetesV2ManifestDeleteCtrl',
      controllerAs: 'ctrl',
      resolve: {
        coordinates: {
          name: this.serverGroupManager.name,
          namespace: this.serverGroupManager.namespace,
          account: this.serverGroupManager.account
        },
        application: this.app,
        manifestController: (): string => null,
      }
    });
  }

  private transformServerGroupManager(serverGroupManagerDetails: IServerGroupManager): IKubernetesServerGroupManager {
    if (!serverGroupManagerDetails) {
      return null;
    }

    const serverGroupManager = serverGroupManagerDetails as IKubernetesServerGroupManager;
    const [kind, name] = serverGroupManager.name.split(' ');
    serverGroupManager.displayName = name;
    serverGroupManager.kind = kind;
    serverGroupManager.namespace = serverGroupManagerDetails.region;
    return serverGroupManager;
  }

  private extractServerGroupManager(stateParams: IServerGroupManagerStateParams): void {
    this.serverGroupManager = this.transformServerGroupManager(this.app.getDataSource('serverGroupManagers').data.find((manager: IServerGroupManager) =>
      manager.name === stateParams.serverGroupManager
        && manager.region === stateParams.region
        && manager.account === stateParams.accountId
    ));
  }
}

export const KUBERNETES_V2_SERVER_GROUP_MANAGER_DETAILS_CTRL = 'spinnaker.kubernetes.v2.serverGroupManager.details.controller';
module(KUBERNETES_V2_SERVER_GROUP_MANAGER_DETAILS_CTRL, [])
  .controller('kubernetesV2ServerGroupManagerDetailsCtrl', KubernetesServerGroupManagerDetailsController)
