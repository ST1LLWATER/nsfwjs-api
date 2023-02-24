import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrediction } from '../../getPrediction.js';
import { FromSchema } from 'json-schema-to-ts';
import * as tf from '@tensorflow/tfjs-node';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { combineResults } from '../../combineResults.js';

export const rawFormBodySchema = {
  type: 'object',
  properties: {
    sources: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['sources'],
} as const;

type BodyEntry = {
  sources: string[];
};

export async function rawBodyForm(
  request: FastifyRequest<{
    Body: FromSchema<typeof rawFormBodySchema>;
  }>,
  reply: FastifyReply
) {
  const { sources } = request.body as BodyEntry;

  async function getImageBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const images = await Promise.all(
    sources.map(async (url: string) => {
      const imageBuffer = await getImageBuffer(url);
      let image = await sharp(imageBuffer)
        .resize({
          width: 299,
          height: 299,
          fit: 'contain',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 100 })
        .toBuffer();

      return tf.node.decodeImage(image, 3);
    })
  );

  const predictions = await Promise.all(
    images.map(async (image) => getPrediction(image))
  );

  const classification = combineResults({ predictions });

  return reply.send({ classification });
}
