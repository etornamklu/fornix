export const getNested = (obj: any, path: string): any => {
    if (!path) return obj

    // Check if this is a top-level path without dots
    if (!path.includes(".")) {
        // First check direct property
        if (obj && obj[path] !== undefined) {
            return obj[path]
        }
        // Then check inside content object if it exists
        if (obj && obj.content && typeof obj.content === "object" && obj.content[path] !== undefined) {
            return obj.content[path]
        }
        return undefined
    }

    // Handle nested paths with dots
    return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export const setNested = (obj: any, path: string, value: any): any => {
    // Check if this is a top-level path without dots
    if (!path.includes(".")) {
        // If this is a report field that's supposed to be in content,
        // update it in the content object if it exists
        if (obj && obj.content && typeof obj.content === "object" && path in obj.content) {
            obj.content[path] = value
            return obj
        }
        // Otherwise set it directly
        obj[path] = value
        return obj
    }

    // Regular nested path handling
    const keys = path.split(".")
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (current[key] === undefined || typeof current[key] !== "object") {
            current[key] = {}
        }
        current = current[key]
    }
    current[keys[keys.length - 1]] = value
    return obj
}
