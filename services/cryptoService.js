/**
 * Crypto Service - Handles End-to-End Encryption
 * Uses Web Crypto API for RSA and AES operations
 */
const cryptoService = {
    // Generate RSA Key Pair
    generateKeyPair: async () => {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        return {
            publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
            privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey)))
        };
    },

    // Import Public Key from Base64
    importPublicKey: async (publicKeyB64) => {
        const binaryDerString = atob(publicKeyB64);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer.buffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    },

    // Import Private Key from Base64
    importPrivateKey: async (privateKeyB64) => {
        const binaryDerString = atob(privateKeyB64);
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }

        return await window.crypto.subtle.importKey(
            "pkcs8",
            binaryDer.buffer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["decrypt"]
        );
    },

    // Encrypt content (Hybrid: AES for content, RSA for AES key)
    encrypt: async (content, recipientPublicKeyB64) => {
        const publicKey = await cryptoService.importPublicKey(recipientPublicKeyB64);

        // 1. Generate AES key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt content with AES
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedContent = new TextEncoder().encode(content);
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encodedContent
        );

        // 3. Export AES key and encrypt it with Recipient's Public Key
        const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            rawAesKey
        );

        return {
            content: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
            iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
            encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
            isEncrypted: true
        };
    },

    // Decrypt content
    decrypt: async (encryptedData, privateKeyB64) => {
        try {
            const privateKey = await cryptoService.importPrivateKey(privateKeyB64);

            // 1. Decrypt AES key with Private Key
            const encryptedKeyBinary = new Uint8Array(atob(encryptedData.encryptedKey).split("").map(c => c.charCodeAt(0)));
            const rawAesKey = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedKeyBinary
            );

            // 2. Import AES key
            const aesKey = await window.crypto.subtle.importKey(
                "raw",
                rawAesKey,
                "AES-GCM",
                true,
                ["decrypt"]
            );

            // 3. Decrypt content
            const contentBinary = new Uint8Array(atob(encryptedData.content).split("").map(c => c.charCodeAt(0)));
            const ivBinary = new Uint8Array(atob(encryptedData.iv).split("").map(c => c.charCodeAt(0)));
            
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBinary },
                aesKey,
                contentBinary
            );

            return new TextDecoder().decode(decryptedContent);
        } catch (error) {
            console.error("Decryption failed:", error);
            return "[Unable to decrypt message]";
        }
    }
};

window.cryptoService = cryptoService;
