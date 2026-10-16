export interface PincodeLookupResult {
    success: boolean
    city: string
    state: string
    district?: string
    postOffices?: string[]
    message?: string
}

// In-memory cache to prevent redundant network calls
const pincodeCache = new Map<string, PincodeLookupResult>()

/**
 * Looks up city, state, and localities for a given 6-digit Indian PIN code
 * using the public Postal Pincode API (https://api.postalpincode.in)
 * with graceful fallback to Zippopotam (https://api.zippopotam.us).
 */
export async function lookupPincode(
    pincode: string,
    signal?: AbortSignal
): Promise<PincodeLookupResult> {
    const cleaned = pincode.trim().replace(/\D/g, '')

    if (cleaned.length !== 6) {
        return {
            success: false,
            city: '',
            state: '',
            message: 'Please enter a valid 6-digit pincode',
        }
    }

    if (pincodeCache.has(cleaned)) {
        return pincodeCache.get(cleaned)!
    }

    // 1. Try postalpincode.in (Official India Post directory API)
    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
            signal,
        })
        if (response.ok) {
            const data = await response.json()
            if (Array.isArray(data) && data.length > 0) {
                const info = data[0]
                if (
                    info.Status === 'Success' &&
                    Array.isArray(info.PostOffice) &&
                    info.PostOffice.length > 0
                ) {
                    const firstPo = info.PostOffice[0]
                    const city =
                        firstPo.District ||
                        firstPo.Division ||
                        firstPo.Block ||
                        firstPo.Name ||
                        ''
                    const state = firstPo.State || ''
                    const postOffices = info.PostOffice.map((po: any) => po.Name).filter(Boolean)

                    const result: PincodeLookupResult = {
                        success: true,
                        city,
                        state,
                        district: firstPo.District,
                        postOffices,
                        message: `Found ${city}, ${state}`,
                    }

                    pincodeCache.set(cleaned, result)
                    return result
                }
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') throw err
        console.warn('Primary postal pincode API failed, trying fallback...', err)
    }

    // 2. Fallback to zippopotam.us
    try {
        const fallbackRes = await fetch(`https://api.zippopotam.us/in/${cleaned}`, {
            signal,
        })
        if (fallbackRes.ok) {
            const fbData = await fallbackRes.json()
            if (fbData && fbData.places && fbData.places.length > 0) {
                const place = fbData.places[0]
                const city = place['place name'] || ''
                const state = place['state'] || ''

                const result: PincodeLookupResult = {
                    success: true,
                    city,
                    state,
                    postOffices: fbData.places.map((p: any) => p['place name']),
                    message: `Found ${city}, ${state}`,
                }

                pincodeCache.set(cleaned, result)
                return result
            }
        }
    } catch (err: any) {
        if (err.name === 'AbortError') throw err
        console.warn('Fallback postal API failed:', err)
    }

    const notFoundResult: PincodeLookupResult = {
        success: false,
        city: '',
        state: '',
        message: 'No location found for this pincode. Please enter manually.',
    }
    return notFoundResult
}
