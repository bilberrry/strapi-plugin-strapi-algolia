# Strapi plugin strapi-algolia

A Strapi plugin to sync your Strapi content with Algolia.  
**NOTE** Plugin works with Strapi v5, no version for Strapi v4 and lower.

## Getting started

### 1. Installation

```bash
yarn add @bilberrry/strapi-plugin-strapi-algolia
```

### 2. Setup environment variables

```bash
ALGOLIA_ADMIN_KEY=your_algolia_app_id
ALGOLIA_APP_ID=your_algolia_api_key
```

### 3. Configure the plugin

#### In Javascript

Add the following code to `./config/plugins.js`

```javascript
'use strict';

module.exports = ({ env }) => ({
  // ...
  'strapi-algolia': {
    enabled: true,
    config: {
      apiKey: env('ALGOLIA_ADMIN_KEY'),
      applicationId: env('ALGOLIA_APP_ID'),
      contentTypes: [
        { name: 'api::article.article' },
        // ...
      ],
    },
  },
});
```

#### In Typescript

Add the following code to `./config/plugins.ts`

```typescript
export default ({ env }) => ({
  // ...
  'strapi-algolia': {
    enabled: true,
    config: {
      apiKey: env('ALGOLIA_ADMIN_KEY'),
      applicationId: env('ALGOLIA_APP_ID'),
      contentTypes: [
        { name: 'api::article.article' },
        // ...
      ],
    },
  },
});
```

#### All configurations options

| Property                              | Description                                                                             | Type                                                                  | Default value                         |
| ------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| applicationId                         | Algolia application ID                                                                  | string **(required)**                                                 |                                       |
| apiKey                                | Algolia API Key                                                                         | string **(required)**                                                 |                                       |
| indexPrefix                           | Prefix for the Algolia index                                                            | string                                                                | `` `${strapi.config.environment}_` `` |
| contentTypes                          | Array of content types needed to be indexed                                             | Array\<object\> **(required)**                                        |                                       |
| contentTypes.name                     | Name of the content type                                                                | string **(required)**                                                 |                                       |
| contentTypes.index                    | Algolia index for the current content type                                              | string                                                                |                                       |
| contentTypes.idPrefix                 | Prefix for the item id                                                                  | string                                                                |                                       |
| contentTypes.populate                 | Which fields needed to be indexed on Algolia, by default all the properties are indexed | [object](https://docs.strapi.io/dev-docs/api/entity-service/populate) | `'*'` = All fields                    |
| contentTypes.hideFields               | Which fields needed to be hidden on Algolia, by default all the properties are indexed  | Array\<string\>                                                       | []                                    |
| contentTypes.transformToBooleanFields | Which fields needed to be transform from null to boolean on Algolia                     | Array\<string\>                                                       | []                                    |

## UI

For each content type configured in the plugin, a new button will be added to the content type list. This button will allow you to index all the content of the content type.

<img width="1492" alt="Capture d’écran 2024-04-04 à 15 14 50" src="https://github.com/wizbii/strapi-plugin-strapi-algolia/assets/3955239/72469d37-2648-4919-8437-0c2b82260edf">

## Endpoints

### Index all the content of a content-type

Call the following endpoint `/strapi-algolia/index-all-articles` with POST method.

The body must be like this:

```json
{
  "name": "api::article.article"
}
```

You must be admin and add an authorization bearer token in the header.

```
Authorization: Bearer YOUR_TOKEN
```

##### Example with curl:

```bash
curl --request POST \
  --url https://YOUR_STRAPI_INSTANCE/strapi-algolia/index-all-articles \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{
	"name": "api::article.article"
}'
```
