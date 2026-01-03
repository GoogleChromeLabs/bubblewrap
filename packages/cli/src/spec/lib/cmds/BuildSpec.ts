import mock from 'mock-fs';
import {build as buildCmd, Build} from '../../../lib/cmds/build';
import * as core from '@bubblewrap/core';
import {computeChecksum} from '../../../lib/cmds/shared';
import {MockPrompt} from '../../mock/MockPrompt';

describe('build', () => {
  describe('#build', () => {
    it('passes unquoted passwords to apksigner and jarsigner', async () => {
      // Create a minimal twa-manifest.json
      const manifest = JSON.stringify({
        packageId: 'com.example.twa',
        host: 'example.com',
        name: 'Test',
        display: 'standalone',
        themeColor: '#FFFFFF',
        navigationColor: '#000000',
        backgroundColor: '#FFFFFF',
        startUrl: '/',
        signingKey: {path: './android.keystore', alias: 'android'},
      });
      const checksum = computeChecksum(Buffer.from(manifest));

      mock({
        'twa-manifest.json': manifest,
        'manifest-checksum.txt': checksum,
      });

      const mockAndroidSdkTools: any = {
        checkBuildTools: async () => true,
        installBuildTools: async () => {},
        zipalignOnlyVerification: async (_: string) => {},
        apksigner: async (_ks: any, ksPass: string, _alias: any, keyPass: string, _in: any, _out: any) => {
          expect(ksPass).toEqual('mystorepass');
          expect(keyPass).toEqual('mykeypass');
        },
      };

      // Instead of running the full build flow, instantiate Build directly and test signApk
      const mockGradleWrapper: any = {
        assembleRelease: async () => {},
        bundleRelease: async () => {},
      };
      const mockKeyTool: any = {};
      const mockJarSigner: any = {
        sign: async (_signingKey: any, storepass: string, keypass: string) => {
          expect(storepass).toEqual('mystorepass');
          expect(keypass).toEqual('mykeypass');
        },
      };

      // Set env so we bypass interactive prompts
      process.env['BUBBLEWRAP_KEYSTORE_PASSWORD'] = 'mystorepass';
      process.env['BUBBLEWRAP_KEY_PASSWORD'] = 'mykeypass';

        const args = { manifest: 'twa-manifest.json', directory: '.', skipSigning: false } as any;
        const buildInstance = new Build(args, mockAndroidSdkTools, mockKeyTool, mockGradleWrapper,
          mockJarSigner, undefined, new MockPrompt() as any);

        await buildInstance.signApk({path: './android.keystore', alias: 'android'} as any,
          {keystorePassword: 'mystorepass', keyPassword: 'mykeypass'});
        await buildInstance.signAppBundle({path: './android.keystore', alias: 'android'} as any,
          {keystorePassword: 'mystorepass', keyPassword: 'mykeypass'});

      mock.restore();
    });
  });
});
