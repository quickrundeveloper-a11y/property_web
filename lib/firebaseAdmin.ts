import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback for build time or when env vars are missing
     // This allows the build to pass without actual credentials
     console.warn('Firebase Admin credentials missing. Using mock credentials for build.');
     admin.initializeApp({
       credential: admin.credential.cert({
          projectId: 'mock-project-id',
          clientEmail: 'mock@example.com',
          privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC2KOxV4xpTS36b\n6412WcU+kywCJj9gf/l70aqt+VahiCsQT5glqtQIqMpR+xzxtmFB/d6RjVrqul0S\nbvEbuN5WytU51llRSieDIeddQSGOSKWEz21Z+us9MJBlGwQkKkgdyRzV1ySgG4tS\nvc7NfMbVzDY+vLhxSdMCpc6fZIgyGc5lA8mmDz5nKCdShr2nZlvJjd6SynG6/7Lm\nY4mZvuW2MVkvyarGQY524vNRrTHUORr77I2ZV6TfBo3ltG/rIraw93LDBX0D2GDM\ndI3Anhym+Tux66kcsRvChbj/UqnGye7M9ssVMZmSs4qgEBLMOXS0qz2srdPbFQ8T\nIpVW654zAgMBAAECggEAONoQ2MVmY/S98R/VKMjfvKXmKE2TniSS0sgfQuj81rFO\n72pIDAmC36j+bBO5dt76/8OiAT9izruXbLdfXM2X5vKrFcAGZE6GgnDEauB2/pdB\nwW+Tq2+al6BekI+b/UWM+G7aJwtcjPPLyekfcBavX+66R15TGlh2GO9yy2Bu+WN3\n47l7dIjcBqlSG0r0hhw7x0+sMdX8LbLfpzxGilunbXLSvTJ6BtqByW6t6dPlyW3g\npKWhDYVx2iQxjfIVDTUU5rGZE63KP/WYX6j8gDLAUknOeEUKemWukOEh91mI7iaz\nsdn/9kDO8UgiY5gQmT0sYLxijFT1aOVXDpD3ia8JEQKBgQD+SNk2c41ltKbgmFPx\nTGLN42Fq96sNRUMFPFg9dSpvqD3DM0/1YkumTTd+jjwPOL5/uuoneyH7/YtKyMvH\nf8SjNicvjd6Esg0dKQ5Wdu9Zg/6bvCVMu3zw0SzVLZtzI+fmUrC5G3HDgYqvp0FH\nflRqlPjhivQxw7bPVV2rMtM0BQKBgQC3Y4PGAvfKCN9vq/Eqz+cenRAL9Jvmeprk\nwgAcbKTcEfp+B9MbVAifZWoucV13DEa9XZ4GdQnjD1BpXBf0mZl5oyIrXIQwcaLo\nqDag6DfhPKKNtf//61onaABqwm1w9tgY8Q2motq6+0Sx34Ufi4Aw+Wngdz1nV/DV\n7uGZh9CW1wKBgQCVF+2UCaiMS6HU6ju9rYX5JisGZvT6MPQc68bpMfuRwFmGTF3D\niMDGX1v8bjU0z5aSmeuU/pNshrrXPGiPLpEDCUtsjIg90Y/y2xG3DMFGASiV83kD\RqL5KAxbagRNPG5KE43e2wKXGStR1oVl/+JLI9HRnIGVdCWJ54mmSYSgaQKBgQCB\njaHXztzyM1Z1c4iJ8BmcPOTLLWC9b7vhA1REwFOuzFyjkC+IzNLSmDhs2tVmdpu6\nx1oNwbzcVUM/Szn5KFGN5rsK2u7fskeeCMee4K4pRkanyf0x9DfaQtSYlwXtmdSL\nui8km0PeeAfNiNRotoo3DtvHITWVvkB7QajKZ3HqPQKBgQDOysn5uxhTBhO70Wew\nVMUpiAhf3/sufF+Ze/tG/tkPIjgvg5Q1dkeCatcdqAErdqCBIc4qfBq8NLIw4OME\nkmmcM2HK+ypkDB1K8Xso4CWrU7CYirwHL+XhxbQdezPFMO5dBJoKqqcPCcDWamNr\n4MSKsR2ODS1XTwkt1MQtogUdKQ==\n-----END PRIVATE KEY-----\n',
        }),
      });
  }
}

export const adminDb = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
