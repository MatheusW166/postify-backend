import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { faker } from '@faker-js/faker';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    prisma = app.get(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.publication.deleteMany({});
    await Promise.all([
      prisma.post.deleteMany({}),
      prisma.media.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('I’m okay!');
  });

  describe('Medias', () => {
    describe('/ (POST)', () => {
      it('Should respond 201 and create a media', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const response = await request(app.getHttpServer())
          .post('/medias')
          .send(body)
          .expect(HttpStatus.CREATED);

        expect(response.body).toEqual({
          ...body,
          id: expect.any(Number),
        });

        const storedMedia = await prisma.media.findMany({});
        expect(storedMedia.length).toBe(1);
      });

      it('Should respond 400 when body has missing fields', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: '',
        };
        const postMedias = request(app.getHttpServer()).post('/medias');
        await postMedias.send(body).expect(HttpStatus.BAD_REQUEST);

        const storedMedia = await prisma.media.findMany({});
        expect(storedMedia.length).toBe(0);
      });

      it('Should respond 409 when media is duplicated', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        await prisma.media.create({ data: body });

        await request(app.getHttpServer())
          .post('/medias')
          .send(body)
          .expect(HttpStatus.CONFLICT);

        const storedMedia = await prisma.media.findMany({});
        expect(storedMedia.length).toBe(1);
      });
    });

    describe('/ (GET)', () => {
      it('Should respond 200 and an empty array', async () => {
        await request(app.getHttpServer())
          .get('/medias')
          .expect(HttpStatus.OK)
          .expect([]);
      });

      it('Should respond 200 and an array of medias', async () => {
        const body = [
          {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
          {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        ];

        await prisma.media.createMany({
          data: body,
        });

        const response = await request(app.getHttpServer())
          .get('/medias')
          .expect(HttpStatus.OK);

        expect(response.body.length).toBe(2);
      });
    });

    describe('/:id (GET)', () => {
      it('Should respond 200 and the found media', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        const media = await prisma.media.create({ data: body });

        await request(app.getHttpServer())
          .get(`/medias/${media.id}`)
          .expect(HttpStatus.OK)
          .expect(media);
      });

      it('Should respond 404 when media id is not found', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        const media = await prisma.media.create({ data: body });

        await request(app.getHttpServer())
          .get(`/medias/${media.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (PUT)', () => {
      it('Should respond 200 and update the media', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const media = await prisma.media.create({ data: body });

        const newMedia = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const updateResponse = { ...newMedia, id: media.id };

        await request(app.getHttpServer())
          .put(`/medias/${media.id}`)
          .send(newMedia)
          .expect(HttpStatus.OK)
          .expect(updateResponse);

        const updatedMedia = await prisma.media.findUnique({
          where: { id: media.id },
        });

        expect(updatedMedia).toEqual(updateResponse);
      });

      it('Should respond 404 when id is not found', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const media = await prisma.media.create({ data: body });

        const newMedia = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        await request(app.getHttpServer())
          .put(`/medias/${media.id + 1}`)
          .send(newMedia)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (DELETE)', () => {
      it('Should respond 204 and delete the media', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const media = await prisma.media.create({ data: body });

        await request(app.getHttpServer())
          .delete(`/medias/${media.id}`)
          .expect(HttpStatus.NO_CONTENT);

        const mediaFound = await prisma.media.findUnique({
          where: { id: media.id },
        });

        expect(mediaFound).toBeNull();
      });

      it('Should respond 404 when id is not found', async () => {
        const body = {
          username: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const media = await prisma.media.create({ data: body });

        await request(app.getHttpServer())
          .delete(`/medias/${media.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('Should respond 403 when media is referenced in publications', async () => {
        const media = await prisma.media.create({
          data: {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        });
        const post = await prisma.post.create({
          data: {
            text: faker.lorem.paragraph(5),
            title: faker.lorem.words({ min: 1, max: 4 }),
          },
        });
        await prisma.publication.create({
          data: {
            date: new Date(),
            mediaId: media.id,
            postId: post.id,
          },
        });

        await request(app.getHttpServer())
          .delete(`/medias/${media.id}`)
          .expect(HttpStatus.FORBIDDEN);

        const mediaFound = await prisma.media.findUnique({
          where: { id: media.id },
        });
        expect(mediaFound).not.toBeNull();
      });
    });
  });

  describe('Posts', () => {
    describe('/ (POST)', () => {
      it('Should respond 201 and create a post', async () => {
        const body = {
          text: faker.lorem.paragraph(5),
          title: faker.internet.domainName(),
        };
        const response = await request(app.getHttpServer())
          .post('/posts')
          .send(body)
          .expect(HttpStatus.CREATED);

        expect(response.body).toEqual({
          ...body,
          id: expect.any(Number),
        });

        const storedPost = await prisma.post.findMany({});
        expect(storedPost.length).toBe(1);
      });

      it('Should respond 400 when body has missing fields', async () => {
        const body = {
          text: faker.lorem.paragraph(5),
          title: '',
        };
        const req = request(app.getHttpServer()).post('/posts');
        await req.send(body).expect(HttpStatus.BAD_REQUEST);

        const storedPost = await prisma.post.findMany({});
        expect(storedPost.length).toBe(0);
      });
    });

    describe('/ (GET)', () => {
      it('Should respond 200 and an empty array', async () => {
        await request(app.getHttpServer())
          .get('/posts')
          .expect(HttpStatus.OK)
          .expect([]);
      });

      it('Should respond 200 and an array of posts', async () => {
        const body = [
          {
            text: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
          {
            text: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        ];

        await prisma.post.createMany({
          data: body,
        });

        const response = await request(app.getHttpServer())
          .get('/posts')
          .expect(HttpStatus.OK);

        expect(response.body.length).toBe(2);
      });
    });

    describe('/:id (GET)', () => {
      it('Should respond 200 and the found post', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        const post = await prisma.post.create({ data: body });

        await request(app.getHttpServer())
          .get(`/posts/${post.id}`)
          .expect(HttpStatus.OK)
          .expect(post);
      });

      it('Should respond 404 when post id is not found', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        const post = await prisma.post.create({ data: body });

        await request(app.getHttpServer())
          .get(`/posts/${post.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (PUT)', () => {
      it('Should respond 200 and update the post', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const post = await prisma.post.create({ data: body });

        const newPost = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const updateResponse = { ...newPost, id: post.id };

        await request(app.getHttpServer())
          .put(`/posts/${post.id}`)
          .send(newPost)
          .expect(HttpStatus.OK)
          .expect(updateResponse);

        const updatedPost = await prisma.post.findUnique({
          where: { id: post.id },
        });

        expect(updatedPost).toEqual(updateResponse);
      });

      it('Should respond 404 when id is not found', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const post = await prisma.post.create({ data: body });

        const newPost = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };

        await request(app.getHttpServer())
          .put(`/posts/${post.id + 1}`)
          .send(newPost)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (DELETE)', () => {
      it('Should respond 204 and delete the post', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const post = await prisma.post.create({ data: body });

        await request(app.getHttpServer())
          .delete(`/posts/${post.id}`)
          .expect(HttpStatus.NO_CONTENT);

        const postFound = await prisma.post.findUnique({
          where: { id: post.id },
        });

        expect(postFound).toBeNull();
      });

      it('Should respond 404 when id is not found', async () => {
        const body = {
          text: faker.internet.displayName(),
          title: faker.internet.domainName(),
        };
        const post = await prisma.post.create({ data: body });

        await request(app.getHttpServer())
          .delete(`/posts/${post.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('Should respond 403 when post is referenced in publications', async () => {
        const media = await prisma.media.create({
          data: {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        });
        const post = await prisma.post.create({
          data: {
            text: faker.lorem.paragraph(5),
            title: faker.lorem.words({ min: 1, max: 4 }),
          },
        });
        await prisma.publication.create({
          data: {
            date: new Date(),
            mediaId: media.id,
            postId: post.id,
          },
        });

        await request(app.getHttpServer())
          .delete(`/posts/${post.id}`)
          .expect(HttpStatus.FORBIDDEN);

        const postFound = await prisma.post.findUnique({
          where: { id: post.id },
        });
        expect(postFound).not.toBeNull();
      });
    });
  });

  describe('Publications', () => {
    describe('/ (POST)', () => {
      it('Should respond 201 and create a publication', async () => {
        const media = await prisma.media.create({
          data: {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        });
        const post = await prisma.post.create({
          data: {
            text: faker.lorem.paragraph(5),
            title: faker.lorem.words({ min: 1, max: 4 }),
          },
        });
        const pub = {
          date: faker.date.future().toISOString(),
          mediaId: media.id,
          postId: post.id,
        };

        const response = await request(app.getHttpServer())
          .post('/publications')
          .send(pub)
          .expect(HttpStatus.CREATED);

        expect(response.body).toEqual({
          ...pub,
          id: expect.any(Number),
        });

        const storedPubs = await prisma.publication.findMany({});
        expect(storedPubs.length).toBe(1);
      });

      it('Should respond 400 when body has missing fields', async () => {
        const media = await prisma.media.create({
          data: {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        });
        const post = await prisma.post.create({
          data: {
            text: faker.lorem.paragraph(5),
            title: faker.lorem.words({ min: 1, max: 4 }),
          },
        });
        const pubWithoutDate = {
          mediaId: media.id,
          postId: post.id,
        };

        await request(app.getHttpServer())
          .post('/publications')
          .send(pubWithoutDate)
          .expect(HttpStatus.BAD_REQUEST);

        const storedPubs = await prisma.publication.findMany({});
        expect(storedPubs.length).toBe(0);
      });

      it('Should respond 404 when media or post does not exist', async () => {
        const media = await prisma.media.create({
          data: {
            username: faker.internet.displayName(),
            title: faker.internet.domainName(),
          },
        });

        const pub = {
          mediaId: media.id,
          postId: faker.number.int({ min: 1, max: 100 }),
          date: faker.date.future().toISOString(),
        };

        await request(app.getHttpServer())
          .post('/publications')
          .send(pub)
          .expect(HttpStatus.NOT_FOUND);

        const storedPubs = await prisma.publication.findMany({});
        expect(storedPubs.length).toBe(0);
      });
    });

    describe('/ (GET)', () => {
      it('Should respond 200 and an empty array', async () => {
        await request(app.getHttpServer())
          .get('/publications')
          .expect(HttpStatus.OK)
          .expect([]);
      });

      it('Should respond 200 and an array of pubs', async () => {
        await prisma.publication.create({
          data: {
            date: new Date(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get('/posts')
          .expect(HttpStatus.OK);

        expect(response.body.length).toBe(1);
      });

      it('Should respond 200 and only published pubs when published is true', async () => {
        const publishedPub = await prisma.publication.create({
          data: {
            date: faker.date.past().toISOString(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await prisma.publication.create({
          data: {
            date: faker.date.future().toISOString(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/publications?published=${true}`)
          .expect(HttpStatus.OK);

        expect(response.body.length).toBe(1);
        expect(response.body).toEqual([
          {
            ...publishedPub,
            date: publishedPub.date.toISOString(),
          },
        ]);
      });

      it('Should respond 200 and pubs which date is bigger than "after"', async () => {
        const after = faker.date.past();

        const pubAfter = await prisma.publication.create({
          data: {
            date: faker.date.future({ refDate: after }),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await prisma.publication.create({
          data: {
            date: faker.date.past({ refDate: after }),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const response = await request(app.getHttpServer())
          .get(`/publications?after=${after.toISOString()}`)
          .expect(HttpStatus.OK);

        expect(response.body.length).toBe(1);
        expect(response.body).toEqual([
          {
            ...pubAfter,
            date: pubAfter.date.toISOString(),
          },
        ]);
      });
    });

    describe('/:id (GET)', () => {
      it('Should respond 200 and the found post', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future().toISOString(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await request(app.getHttpServer())
          .get(`/publications/${pub.id}`)
          .expect(HttpStatus.OK)
          .expect({
            ...pub,
            date: pub.date.toISOString(),
          });
      });

      it('Should respond 404 when post id is not found', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await request(app.getHttpServer())
          .get(`/publications/${pub.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (PUT)', () => {
      it('Should respond 200 and update the post', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future().toISOString(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const newPub = {
          mediaId: pub.mediaId,
          postId: pub.postId,
          date: faker.date.future({ refDate: pub.date }),
        };
        const updateResponse = { ...newPub, id: pub.id };

        await request(app.getHttpServer())
          .put(`/publications/${pub.id}`)
          .send(newPub)
          .expect(HttpStatus.OK)
          .expect({
            ...updateResponse,
            date: updateResponse.date.toISOString(),
          });

        const updatedPub = await prisma.publication.findUnique({
          where: { id: pub.id },
        });

        expect(updatedPub).toEqual(updateResponse);
      });

      it('Should respond 404 when id is not found', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const newPub = {
          mediaId: pub.mediaId,
          postId: pub.postId,
          date: faker.date.future({ refDate: pub.date }),
        };

        await request(app.getHttpServer())
          .put(`/publications/${pub.id + 1}`)
          .send(newPub)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('Should respond 404 when mediaId or postId is not found', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        const newPub = {
          mediaId: pub.mediaId + 1,
          postId: pub.postId,
          date: faker.date.future({ refDate: pub.date }),
        };

        await request(app.getHttpServer())
          .put(`/publications/${pub.id}`)
          .send(newPub)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('/:id (DELETE)', () => {
      it('Should respond 204 and delete the post', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await request(app.getHttpServer())
          .delete(`/publications/${pub.id}`)
          .expect(HttpStatus.NO_CONTENT);

        const pubFound = await prisma.post.findUnique({
          where: { id: pub.id },
        });

        expect(pubFound).toBeNull();
      });

      it('Should respond 404 when id is not found', async () => {
        const pub = await prisma.publication.create({
          data: {
            date: faker.date.future(),
            Media: {
              create: {
                username: faker.internet.displayName(),
                title: faker.internet.domainName(),
              },
            },
            Post: {
              create: {
                text: faker.lorem.paragraph(5),
                title: faker.lorem.words({ min: 1, max: 4 }),
              },
            },
          },
        });

        await request(app.getHttpServer())
          .delete(`/publications/${pub.id + 1}`)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });
});
