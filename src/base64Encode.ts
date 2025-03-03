/**
 * 将 ArrayBuffer 对象编码为 Base64 字符串。
 * @param byteArray {ArrayBuffer} - 需要进行 Base64 编码的 ArrayBuffer 对象。
 * @returns {string} 编码后的 Base64 字符串。
 */
export function base64Encode(byteArray: ArrayBuffer | Uint8Array): string {
    const buffer = new Uint8Array(byteArray);
    const binaryString = buffer.reduce(
        (str, byte) => str + String.fromCharCode(byte),
        "",
    );
    const encoded = btoa(binaryString)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    return encoded;
}
