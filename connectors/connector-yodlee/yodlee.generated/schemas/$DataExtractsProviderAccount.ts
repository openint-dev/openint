/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $DataExtractsProviderAccount = {
  properties: {
    destinationProviderAccountId: {
      type: 'number',
      description: `The providerAccountId that is retained as part of the many-to-one OAuth migration process.<br><b>Endpoints</b>:<ul><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
      format: 'int64',
    },
    oauthMigrationStatus: {
      type: 'Enum',
      isReadOnly: true,
    },
    isManual: {
      type: 'boolean',
      description: `Indicates whether account is a manual or aggregated provider account.<br><br><b>Endpoints</b>:<ul><li>GET providerAccounts</li><li>POST providerAccounts</li><li>PUT providerAccounts/{providerAccountId}</li><li>GET providerAccounts/{providerAccountId}</li><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
    },
    lastUpdated: {
      type: 'string',
      description: `Indicate when the providerAccount is last updated successfully.<br><br><b>Account Type</b>: Aggregated<br><b>Endpoints</b>:<ul><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
    },
    createdDate: {
      type: 'string',
      description: `The date on when the provider account is created in the system.<br><br><b>Endpoints</b>:<ul><li>GET providerAccounts</li><li>POST providerAccounts</li><li>PUT providerAccounts/{providerAccountId}</li><li>GET providerAccounts/{providerAccountId}</li></ul>`,
      isReadOnly: true,
    },
    aggregationSource: {
      type: 'Enum',
      isReadOnly: true,
    },
    isDeleted: {
      type: 'boolean',
      description: `Indicates if the provider account is deleted from the system.<b>Applicable containers</b>: All Containers<br><b>Aggregated / Manual</b>: Both <br><b>Endpoints</b>:<br><ul><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
    },
    providerId: {
      type: 'number',
      description: `Unique identifier for the provider resource. This denotes the provider for which the provider account id is generated by the user.<br><br><b>Endpoints</b>:<ul><li>GET providerAccounts</li><li>POST providerAccounts</li><li>PUT providerAccounts/{providerAccountId}</li><li>GET providerAccounts/{providerAccountId}</li><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
      format: 'int64',
    },
    requestId: {
      type: 'string',
      description: `Unique id generated to indicate the request.<br><br><b>Endpoints</b>:<ul><li>GET providerAccounts</li><li>POST providerAccounts</li><li>PUT providerAccounts/{providerAccountId}</li><li>GET providerAccounts/{providerAccountId}</li></ul>`,
      isReadOnly: true,
    },
    sourceProviderAccountIds: {
      type: 'array',
      contains: {
        type: 'number',
        format: 'int64',
      },
      isReadOnly: true,
    },
    id: {
      type: 'number',
      description: `Unique identifier for the provider account resource. This is created during account addition.<br><br><b>Endpoints</b>:<ul><li>GET providerAccounts</li><li>POST providerAccounts</li><li>PUT providerAccounts/{providerAccountId}</li><li>GET providerAccounts/{providerAccountId}</li><li>GET dataExtracts/userData</li></ul>`,
      isReadOnly: true,
      format: 'int64',
    },
    dataset: {
      type: 'array',
      contains: {
        type: 'AccountDataset',
      },
      isReadOnly: true,
    },
    status: {
      type: 'Enum',
      isReadOnly: true,
    },
  },
} as const