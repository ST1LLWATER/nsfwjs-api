import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrediction } from '../../getPrediction.js';
import { FromSchema } from 'json-schema-to-ts';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs-node';

export const multipleMultipartFormBodySchema = {
  type: 'object',
  properties: {
    contents: {
      type: 'array',
      items: {
        $ref: '#mySharedSchema',
      },
    },
  },
  required: ['contents'],
} as const;

type BodyEntry = {
  data: Buffer;
  filename: string;
  encoding: string;
  mimetype: string;
  limit: false;
};

export async function MultipleMultipartForm(
  request: FastifyRequest<{
    Body: FromSchema<typeof multipleMultipartFormBodySchema>;
  }>,
  reply: FastifyReply
) {
  const convert = async (img: Buffer) => {
    // Decoded image in UInt8 Byte array
    const image = await sharp(img)
      .jpeg({ quality: 100 })
      .resize({
        width: 1080,
        height: 1080,
        fit: 'contain',
        withoutEnlargement: true,
      })
      .toBuffer();

    return tf.node.decodeImage(image, 3);
  };

  let imagesData = request.body.contents as BodyEntry[];

  const images = await Promise.all(
    imagesData.map(async (file) => {
      const image = await convert(file.data);
      return image;
    })
  );

  const predictions = await Promise.all(
    images.map(async (image) => {
      return getPrediction(image);
    })
  );

  return reply.send({ predictions });
}
