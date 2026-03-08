'use strict'

/**
 * GoStream Protocol (GSP) implementation
 *
 * Packet format (Little Endian):
 *   U8[2]  header  = 0xEB 0xA6
 *   U8     protoid = 0x00
 *   U16    length  = total bytes that follow, including CRC
 *   U8[]   command = JSON-encoded GoStreamCommand
 *   U16    crc     = CRC-16 Modbus over all bytes from header to end of command
 *
 * A TCP datagram may contain multiple packets; a packet may be split across
 * multiple datagrams.  The parser below handles both cases using a carry buffer.
 */

const HEAD1 = 0xeb
const HEAD2 = 0xa6
const PROTO_ID = 0x00
const PACKET_HEADER_SIZE = 5 // header(2) + protoid(1) + length(2)
const PACKET_HEAD = Buffer.from([HEAD1, HEAD2])

/** CRC-16 / MODBUS – poly 0x8005, init 0xFFFF, reflected */
function crc16modbus(buf) {
	let crc = 0xffff
	for (let i = 0; i < buf.length; i++) {
		crc ^= buf[i]
		for (let j = 0; j < 8; j++) {
			if (crc & 0x0001) {
				crc = (crc >>> 1) ^ 0xa001
			} else {
				crc >>>= 1
			}
		}
	}
	return crc & 0xffff
}

/** Pack a raw JSON buffer into a GoStream wire packet */
function packPacket(jsonBuf) {
	// length field covers JSON + 2-byte CRC
	const dataLen = jsonBuf.length + 2
	const packet = Buffer.allocUnsafe(PACKET_HEADER_SIZE + dataLen)
	packet[0] = HEAD1
	packet[1] = HEAD2
	packet[2] = PROTO_ID
	packet.writeUInt16LE(dataLen, 3)
	jsonBuf.copy(packet, PACKET_HEADER_SIZE)
	const crc = crc16modbus(packet.subarray(0, PACKET_HEADER_SIZE + jsonBuf.length))
	packet.writeUInt16LE(crc, PACKET_HEADER_SIZE + jsonBuf.length)
	return packet
}

/** Encode a GoStreamCommand into a wire packet */
function encodeCommand(cmd) {
	const json = JSON.stringify(cmd)
	const jsonBuf = Buffer.from(json, 'utf8')
	return packPacket(jsonBuf)
}

/** Validate CRC of a fully-received packet buffer */
function isCrcOk(packetBuf) {
	const dataLen = packetBuf.readUInt16LE(3)
	if (packetBuf.length < PACKET_HEADER_SIZE + dataLen) return false
	const payloadEnd = PACKET_HEADER_SIZE + dataLen - 2
	const recvCrc = packetBuf.readUInt16LE(payloadEnd)
	const calcCrc = crc16modbus(packetBuf.subarray(0, payloadEnd))
	return recvCrc === calcCrc
}

/** Unpack the JSON payload from a complete packet buffer */
function unpackPacket(packetBuf) {
	const dataLen = packetBuf.readUInt16LE(3)
	const jsonBuf = packetBuf.subarray(PACKET_HEADER_SIZE, PACKET_HEADER_SIZE + dataLen - 2)
	try {
		return JSON.parse(jsonBuf.toString('utf8'))
	} catch (_) {
		return null
	}
}

/**
 * Stateful packet parser.  Call createParser() once per connection.
 * Feed incoming data chunks to parser.feed(); it returns an array of
 * decoded GoStreamCommand objects.
 */
function createParser() {
	let carry = null // Buffer | null

	function feed(chunk) {
		const commands = []
		let data = carry !== null ? Buffer.concat([carry, chunk]) : chunk
		carry = null

		let index = data.indexOf(PACKET_HEAD)

		// Handle data before the first header (continuation of a split packet)
		if (index !== 0) {
			if (index < 0) {
				// No header found – entire chunk belongs to previous packet
				if (carry !== null) {
					carry = Buffer.concat([carry, data])
				} else {
					// this shouldn't happen if carry was null, but be safe
					carry = Buffer.from(data)
				}
				return commands
			}
			// Header found at offset > 0 – data before it is orphaned, drop it
			data = data.subarray(index)
		}

		// Walk through all complete packets in `data`
		let pos = 0
		while (pos < data.length) {
			// Need at least PACKET_HEADER_SIZE bytes to read the length field
			if (pos + PACKET_HEADER_SIZE > data.length) {
				carry = Buffer.from(data.subarray(pos))
				break
			}
			const dataLen = data.readUInt16LE(pos + 3)
			const packetEnd = pos + PACKET_HEADER_SIZE + dataLen
			if (packetEnd > data.length) {
				// Incomplete packet – save and wait for more data
				carry = Buffer.from(data.subarray(pos))
				break
			}
			const packetBuf = data.subarray(pos, packetEnd)
			if (isCrcOk(packetBuf)) {
				const cmd = unpackPacket(packetBuf)
				if (cmd !== null) commands.push(cmd)
			}
			pos = packetEnd
			// Skip to next header
			const nextHeader = data.indexOf(PACKET_HEAD, pos)
			if (nextHeader < 0) {
				if (pos < data.length) carry = Buffer.from(data.subarray(pos))
				break
			}
			pos = nextHeader
		}

		return commands
	}

	function reset() {
		carry = null
	}

	return { feed, reset }
}

/** Convenience: encode multiple commands into one buffer */
function encodeCommands(cmds) {
	return Buffer.concat(cmds.map(encodeCommand))
}

const ReqType = {
	Get: 'get',
	Set: 'set',
	Push: 'pus',
	Res: 'res',
}

module.exports = { encodeCommand, encodeCommands, createParser, crc16modbus, ReqType }
