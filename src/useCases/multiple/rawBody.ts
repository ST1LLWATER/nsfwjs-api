import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrediction } from '../../getPrediction.js';
import { FromSchema } from 'json-schema-to-ts';
import * as tf from '@tensorflow/tfjs-node';
import fetch from 'node-fetch';
import sharp from 'sharp';

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
    return await res.buffer();
  }

  const images = await Promise.all(
    sources.map(async (url: string) => {
      const imageBuffer = await getImageBuffer(url);
      let image = await sharp(imageBuffer)
        .resize({
          width: 1080,
          height: 1080,
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

  return reply.send({predictions});
}
