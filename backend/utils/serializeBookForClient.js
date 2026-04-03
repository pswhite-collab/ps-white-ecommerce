import { generateSecureUrl } from './generateSignedUrl.js';

const DEFAULT_PUBLIC_ASSET_EXPIRES_IN = 60 * 60;
const configuredPublicAssetExpiresIn = Number.parseInt(
  process.env.PUBLIC_ASSET_SIGNED_URL_EXPIRES_IN ||
    process.env.READER_SIGNED_URL_EXPIRES_IN ||
    `${DEFAULT_PUBLIC_ASSET_EXPIRES_IN}`,
  10
);

const publicAssetExpiresIn = Number.isNaN(configuredPublicAssetExpiresIn)
  ? DEFAULT_PUBLIC_ASSET_EXPIRES_IN
  : Math.max(60, configuredPublicAssetExpiresIn);

const isAbsoluteUrl = (value = '') => /^https?:\/\//i.test(String(value).trim());

const toPlainObject = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value.toObject === 'function') {
    return value.toObject();
  }

  return { ...value };
};

const serializeAssetUrl = async (value) => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue || isAbsoluteUrl(normalizedValue)) {
    return normalizedValue;
  }

  return generateSecureUrl(normalizedValue, { expiresIn: publicAssetExpiresIn });
};

export const serializeBookForClient = async (book) => {
  if (!book) {
    return book;
  }

  const plainBook = toPlainObject(book);
  const coverImage = plainBook?.coverImage ? toPlainObject(plainBook.coverImage) : null;

  if (!coverImage) {
    return plainBook;
  }

  const [url, thumbnail] = await Promise.all([
    serializeAssetUrl(coverImage.url),
    serializeAssetUrl(coverImage.thumbnail),
  ]);

  return {
    ...plainBook,
    coverImage: {
      ...coverImage,
      url: url || coverImage.url,
      thumbnail: thumbnail || coverImage.thumbnail,
    },
  };
};

export const serializeBooksForClient = async (books = []) =>
  Promise.all((books || []).map((book) => serializeBookForClient(book)));

export const serializeEntityWithBookForClient = async (entity, key = 'book') => {
  if (!entity) {
    return entity;
  }

  const plainEntity = toPlainObject(entity);
  if (!plainEntity?.[key]) {
    return plainEntity;
  }

  return {
    ...plainEntity,
    [key]: await serializeBookForClient(plainEntity[key]),
  };
};

export const serializeEntitiesWithBookForClient = async (entities = [], key = 'book') =>
  Promise.all(
    (entities || []).map((entity) => serializeEntityWithBookForClient(entity, key))
  );

export const serializeReviewForClient = async (review) =>
  serializeEntityWithBookForClient(review, 'book');

export const serializeReviewsForClient = async (reviews = []) =>
  Promise.all((reviews || []).map((review) => serializeReviewForClient(review)));

export const serializeOrderForClient = async (order) => {
  if (!order) {
    return order;
  }

  const plainOrder = toPlainObject(order);
  const serializedItems = await Promise.all(
    (plainOrder.items || []).map(async (item) => {
      const plainItem = toPlainObject(item);
      if (!plainItem?.book || typeof plainItem.book !== 'object') {
        return plainItem;
      }

      return {
        ...plainItem,
        book: await serializeBookForClient(plainItem.book),
      };
    })
  );

  return {
    ...plainOrder,
    items: serializedItems,
  };
};
