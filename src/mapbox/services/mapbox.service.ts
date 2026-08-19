import mbxClient from '@mapbox/mapbox-sdk';
// import mbxTilesets from '@mapbox/mapbox-sdk/services/tilesets';
import mbxUploads from '@mapbox/mapbox-sdk/services/uploads';
import { mesiboService } from '@mesibo/services';
import '@config';
import * as fs from 'fs';
import AWS from 'aws-sdk';
import path from 'path';
import { prisma } from '@database';
import { Feature } from '@mapbox/types';

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_TOKEN });
// const tylesetService = mbxTilesets(baseClient);
const uploadsClient = mbxUploads(baseClient);

class MapBoxService {
  async getCredentials() {
    return uploadsClient
      .createUploadCredentials()
      .send()
      .then((response) => response.body);
  }

  async putFileOnS3(credentials: any, file: string) {
    const s3 = new AWS.S3({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region: 'us-east-1',
    });
    return s3
      .putObject({
        Bucket: credentials.bucket,
        Key: credentials.key,
        Body: fs.createReadStream(file),
      })
      .promise();
  }

  async uploadPoints(file: string, fileName: string) {
    const credentials = await this.getCredentials();
    await this.putFileOnS3(credentials, file);
    uploadsClient
      .createUpload({
        tileset: `${process.env.MAPBOX_USERNAME}.${fileName.split('.')[0]}`,
        url: credentials.url,
        name: fileName,
      })
      .send()
      .then((response) => {
        const upload = response.body;
        console.log(upload);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  async createPointFromFeature(feature: Feature) {
    const { coordinates } = feature.geometry;
    const props = feature.properties;
    const existing = await prisma.point.findFirst({
      where: { origId: `${props.id}` },
    });
    if (existing) {
      return existing;
    }
    return await prisma.point.create({
      data: {
        origId: `${props.id}`,
        type: props.type ?? null,
        name: props.name ?? null,
        address: props.address ?? null,
        longitude: coordinates[0].toString(),
        latitude: coordinates[1].toString(),
        number_of_parking_spots: props.number_of_parking_spots ?? null,
        verified: props.verified ?? null,
        price_per_night:
          typeof props.price_per_night === 'boolean'
            ? props.price_per_night
              ? 'true'
              : 'false'
            : (props.price_per_night ?? null),
        security_rating: props.security_rating ?? null,
      },
    });
  }

  async processJsonFiles(folderPath: string) {
    const files = fs.readdirSync(folderPath);

    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(folderPath, file);
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
        for (const feature of jsonData.features) {
          const dbExisting = await prisma.point.findFirst({
            where: {
              name: feature.properties.name,
              address: feature.properties.address,
              id: feature.properties.id,
            },
          });
          if (dbExisting) {
            if (!feature.properties.mesiboId) {
              const mesiboId = await mesiboService.createChatForPoint(feature);
              feature.properties.mesiboId = mesiboId;
            }
            continue;
          }
          await this.createPointFromFeature(feature);
          const mesiboId = await mesiboService.createChatForPoint(feature);
          feature.properties.mesiboId = mesiboId;
        }
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        console.log(`File ${file} updated successfully`);
        this.uploadPoints(filePath, file);
        console.log(`File ${file} uploaded successfully`);
      } catch (error) {
        console.error(`Error processing file ${file}: ${error.message}`);
      }
    }
  }

  async exportPointsGroupedByType(outputDirStr = 'parkings-json') {
    const allPoints = await prisma.point.findMany();
    const groupedByType: Record<string, any[]> = {};

    for (const point of allPoints) {
      const type = point.type ?? 'unknown';

      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }

      groupedByType[type].push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(point.longitude ?? '0'),
            parseFloat(point.latitude ?? '0'),
          ],
        },
        properties: {
          id: point.id,
          type: point.type,
          name: point.name,
          address: point.address,
          number_of_parking_spots: point.number_of_parking_spots,
          verified: point.verified,
          price_per_night: point.price_per_night,
          security_rating: point.security_rating,
          google_maps_link: `https://www.google.com/maps?q=${point.latitude},${point.longitude}`,
          mesiboId: point.chatid,
        },
      });
    }

    const outputDir = path.resolve(outputDirStr);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    for (const [type, features] of Object.entries(groupedByType)) {
      const geoJson = {
        type: 'FeatureCollection',
        features,
      };

      const filePath = path.join(outputDir, `${type}.json`);
      fs.writeFileSync(filePath, JSON.stringify(geoJson, null, 2), 'utf-8');
      console.log(`Saved ${filePath}`);
    }

    console.log('Done!');
  }
}

export const mapBoxService = new MapBoxService();

function start() {
  // mapBoxService.exportPointsGroupedByType();
  mapBoxService.processJsonFiles('parkings-json');
}
start();
// uploadsClient
//   .getUpload({
//     uploadId: 'cm91e1hy745111ntjb1ssty2f',
//   })
//   .send()
//   .then((response) => {
//     console.log(response.body);
//   });
// mapBoxService.uploadPoints(points);
// tylesetService
//   .listTilesets({
//     ownerId: process.env.MAPBOX_USERNAME,
//   })
//   .send()
//   .then((responce) => {
//     console.log(responce);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
// mapBoxService.addPoints(points);
