/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Google Widevine DRM
 *
 * @class
 * @implements MediaPlayer.dependencies.protection.KeySystem
 */
MediaPlayer.dependencies.protection.KeySystem_Widevine = function() {
    "use strict";

    var keySystemStr = "com.widevine.alpha",
        keySystemUUID = "edef8ba9-79d6-4ace-a3c8-27dcd51d21ed",
        protData = null,

        replaceKID = function (pssh, KID) {
            var pssh_array,
                replace = true,
                kidLen = 16,
                pos,
                i, j;

            pssh_array = new Uint8Array(pssh);

            for (i = 0; i <= pssh_array.length - (kidLen + 2); i++) {
                if (pssh_array[i] === 0x12 && pssh_array[i+1] === 0x10) {
                    pos = i + 2;
                    for (j = pos; j < (pos + kidLen); j++) {
                        if (pssh_array[j] !== 0xFF) {
                            replace = false;
                            break;
                        }
                    }
                    break;
                }
            }

            if (replace) {
                pssh_array.set(KID, pos);
            }

            return pssh_array.buffer;
        },

        doGetInitData = function(cpData) {
            var pssh = null;
            // Get pssh from protectionData or from manifest
            if (protData && protData.pssh) {
                pssh = BASE64.decodeArray(protData.pssh).buffer;
            } else {
                pssh = MediaPlayer.dependencies.protection.CommonEncryption.parseInitDataFromContentProtection(cpData);
            }

            // Check if KID within pssh is empty, in that case set KID value according to 'cenc:default_KID' value
            if (pssh) {
                pssh = replaceKID(pssh, cpData['cenc:default_KID']);
            }

            return pssh;
        },

        doGetKeySystemConfigurations = function(videoCodec, audioCodec, sessionType) {
            var ksConfigurations = MediaPlayer.dependencies.protection.CommonEncryption.getKeySystemConfigurations(videoCodec, audioCodec, sessionType);
            if (protData) {
                if (protData.audioRobustness) {
                    ksConfigurations[0].audioCapabilities[0].robustness = protData.audioRobustness;
                }
                if (protData.videoRobustness) {
                    ksConfigurations[0].videoCapabilities[0].robustness = protData.videoRobustness;
                }
            }
            return ksConfigurations;
        },

        doGetServerCertificate = function() {
            if (protData && protData.serverCertificate && protData.serverCertificate.length > 0) {
                return BASE64.decodeArray(protData.serverCertificate).buffer;
            }
            return null;
        };

    return {

        schemeIdURI: "urn:uuid:" + keySystemUUID,
        systemString: keySystemStr,
        uuid: keySystemUUID,
        sessionType: "temporary",

        init: function(protectionData) {
            if (protectionData) {
                protData = protectionData;
                if (protData.sessionType) {
                    this.sessionType = protData.sessionType;
                }
            }
        },

        getInitData: doGetInitData,

        getKeySystemConfigurations: doGetKeySystemConfigurations,

        getRequestHeadersFromMessage: function(/*message*/) { return null; },

        getLicenseRequestFromMessage: function(message) { return new Uint8Array(message); },

        getLicenseServerURLFromInitData: function(/*initData*/) { return null; },

        getCDMData: function() { return null; },

        getServerCertificate: doGetServerCertificate

    };
};

MediaPlayer.dependencies.protection.KeySystem_Widevine.prototype = {
    constructor: MediaPlayer.dependencies.protection.KeySystem_Widevine
};