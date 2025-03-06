import { Core, UID } from '@strapi/strapi';
import { algoliasearch } from 'algoliasearch';
import { HookEvent } from '../../../utils/event';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  getStrapiObject: async (
    event: HookEvent,
    populate: any,
    hideFields: string[]
  ) => {
    const strapiAlgolia = strapi.plugin('strapi-algolia');
    const utilsService = strapiAlgolia.service('utils');

    const { model } = event;
    const modelUid = model.uid as UID.ContentType;
    const entryId = utilsService.getEntryId(event);

    if (!entryId) {
      throw new Error(`No entry id found in event.`);
    }

    const strapiObject = await strapi.documents(modelUid).findOne({
      documentId: event.result.documentId,
      locale: event.result.locale,
      // the documentId can have a published & unpublished version associated
      // without a status filter, the unpublished version could be returned even if a published on exists,
      // which would incorrectly de-index.
      status: 'published',
      populate,
    });

    if (!strapiObject || String(strapiObject.id) !== String(entryId)) {
      return null;
    }

    return utilsService.filterProperties(strapiObject, hideFields);
  },
  afterUpdateAndCreate: async (
    _events: any[],
    populate: any,
    hideFields: string[],
    transformToBooleanFields: string[],
    idPrefix: string,
    algoliaClient: ReturnType<typeof algoliasearch>,
    indexName: string
  ) => {
    const strapiAlgolia = strapi.plugin('strapi-algolia');
    const algoliaService = strapiAlgolia.service('algolia');
    const strapiService = strapiAlgolia.service('strapi');
    const utilsService = strapiAlgolia.service('utils');

    const objectsToSave: any[] = [];
    const objectsIdsToDelete: string[] = [];
    const events = _events as HookEvent[];

    for (const event of events) {
      try {
        const entryId = `${idPrefix}${utilsService.getEntryId(
          event
        )}`;
        const strapiObject = await strapiService.getStrapiObject(
          event,
          populate,
          hideFields
        );

        if (strapiObject) {
          if (strapiObject.publishedAt === null) {
            objectsIdsToDelete.push(entryId);
          } else {
            objectsToSave.push({
              objectID: entryId,
              ...strapiObject,
            });
          }
        }
      } catch (error) {
        console.error(
          `Error while updating Algolia index: ${JSON.stringify(
            error
          )}`
        );
      }
    }

    await algoliaService.createOrDeleteObjects(
      objectsToSave,
      objectsIdsToDelete,
      algoliaClient,
      indexName,
      transformToBooleanFields
    );
  },
  afterUpdateAndCreateAlreadyPopulate: async (
    articles: any[],
    idPrefix: string,
    algoliaClient: ReturnType<typeof algoliasearch>,
    indexName: string,
    transformToBooleanFields: string[] = []
  ) => {
    const strapiAlgolia = strapi.plugin('strapi-algolia');
    const algoliaService = strapiAlgolia.service('algolia');

    const objectsToSave: any[] = [];
    const objectsIdsToDelete: string[] = [];

    for (const article of articles) {
      try {
        const entryId = article.id;
        const entryIdWithPrefix = `${idPrefix}${entryId}`;

        if (article.publishedAt === null) {
          objectsIdsToDelete.push(entryIdWithPrefix);
        } else {
          objectsToSave.push({
            objectID: entryIdWithPrefix,
            ...article,
          });
        }
      } catch (error) {
        console.error(
          `Error while updating Algolia index: ${JSON.stringify(
            error
          )}`
        );
      }
    }

    await algoliaService.createOrDeleteObjects(
      objectsToSave,
      objectsIdsToDelete,
      algoliaClient,
      indexName,
      transformToBooleanFields
    );
  },
  afterDeleteOneOrMany: async (
    _event: any,
    idPrefix: string,
    algoliaClient: ReturnType<typeof algoliasearch>,
    indexName: string,
    many: boolean
  ) => {
    try {
      const event = _event as HookEvent;
      const strapiIds = many
        ? event?.params?.where?.['$and'][0]?.id['$in']
        : [event.params.where.id];
      const objectIDs = strapiIds.map(
        (id: string) => `${idPrefix}${id}`
      );

      await algoliaClient.deleteObjects({ indexName, objectIDs });
    } catch (error) {
      console.error(
        `Error while deleting object(s) from Algolia index: ${error}`
      );
    }
  },
});
