const express = require('express')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const axios = require('axios')
const multer = require('multer')
const app = express()
const dataDir = path.join(__dirname, 'JSON') // Change toJSONfolder
// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
}
// Use middleware to parse JSON request body
app.use(express.json({ limit: '20mb' })) // Increase the limit，Thumbnails may be large

// Set up static folder，For accessing uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer，For handling file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
})

// OptimizegetStageDatafunction，Better handle errors
const getStageData = async (filePath) => {
    try {
        // Check if the file exists
        try {
            await fsPromises.access(filePath, fs.constants.F_OK)
        } catch (error) {
            return { valid: false, data: null, error: 'file not found' }
        }

        // Read the file content
        const data = await fsPromises.readFile(filePath, 'utf8')

        // Validate the content
        if (!data || data.trim() === '') {
            return { valid: false, data: null, error: 'file content is empty' }
        }

        // Try to parseJSON
        try {
            const jsonData = JSON.parse(data)
            return { valid: true, data: jsonData }
        } catch (parseError) {
            console.error(`JSONparsing error: ${parseError.message}`)

            // Get error location information
            const errorPosition = parseError.message.match(/position (\d+)/)
            const errorLine = parseError.message.match(/line (\d+)/)

            let errorContext = ''
            if (errorPosition && errorPosition[1]) {
                const pos = parseInt(errorPosition[1])
                // Provide error context，Help debug
                const start = Math.max(0, pos - 100)
                const end = Math.min(data.length, pos + 100)
                errorContext = data.substring(start, end)
            }

            return {
                valid: false,
                data: null,
                error: parseError.message,
                errorContext,
                errorLine: errorLine ? errorLine[1] : undefined
            }
        }
    } catch (fileError) {
        console.error(`file read error: ${fileError.message}`)
        return { valid: false, data: null, error: fileError.message }
    }
}


// File filtering，Limit to accepting only image types
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.jpeg', '.jpg', '.png', '.gif']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedTypes.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('only support jpg、jpeg、png、gif format images'))
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
    }
})

// Define a unified response format
const sendResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        code: statusCode,
        message,
        data
    })
}

// Upload image interface
app.post('/test/uploadImage', upload.single('file'), function (req, res) {
    // Check if there is a file uploaded
    if (!req.file) {
        return sendResponse(res, 400, 'no file uploaded')
    }

    // Construct accessible image URL
    const imageUrl = `/uploads/${req.file.filename}`

    // Return the image's URL
    return sendResponse(res, 200, 'upload successful', { id: req.file.filename, url: imageUrl })
})

// Get image list interface
app.get('/test/imageList', async (req, res) => {
    try {
        // Ensure the uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
            return sendResponse(res, 200, 'get image list successfully', [])
        }

        const files = await fsPromises.readdir(uploadsDir)

        // Construct image list，Each image contains id and URL
        const imageList = files.map((filename) => ({
            id: filename,
            url: `/uploads/${filename}`
        }))

        return sendResponse(res, 200, 'get image list successfully', imageList)
    } catch (error) {
        console.error(error)
        return sendResponse(res, 500, 'get image list failed')
    }
})

// Save data interface 
app.post('/test/save', async (req, res) => {
    const { id, stageJson, name, thumbnail, isPublished } = req.body

    if (!id) {
        return res.status(400).json({ code: 400, message: 'missingIDparameter' })
    }

    try {
        const filePath = path.join(dataDir, `${id}.json`)
        const metaPath = path.join(dataDir, `${id}_meta.json`)

        // Save main data
        const currentTime = Date.now()
        const saveData = {
            id,
            name,
            stageJson,
            lastSavedTime: currentTime
        }

        // Use fsPromises Write files asynchronously
        await fsPromises.writeFile(filePath, JSON.stringify(saveData, null, 2))

        // Save metadata（Thumbnail and publication status）
        let metaData = {}
        if (fs.existsSync(metaPath)) {
            try {
                const metaContent = await fsPromises.readFile(metaPath, 'utf8')
                metaData = JSON.parse(metaContent)
            } catch (err) {
                console.error('failed to read metadata，create new metadata', err)
                metaData = {}
            }
        }

        // Update metadata
        metaData = {
            ...metaData,
            id,
            lastModified: currentTime
        }

        // Only update if a thumbnail is provided
        if (thumbnail) {
            metaData.thumbnail = thumbnail
        }

        // Only when explicitly setisPublishedOnly then update
        if (isPublished !== undefined) {
            metaData.isPublished = isPublished
        }

        // Save metadata file
        await fsPromises.writeFile(metaPath, JSON.stringify(metaData, null, 2))

        return res.json({
            code: 200,
            message: 'save successful',
            data: {
                lastSavedTime: currentTime
            }
        })
    } catch (err) {
        console.error('failed to save canvas data', err)
        return res.status(500).json({ code: 500, message: 'save failed：' + err.message })
    }
})

// Get saved data interface - Already supports returning time field
app.get('/test/getData', async (req, res) => {
    const { id } = req.query
    if (!id) {
        return res.status(400).json({ code: 400, message: 'missingIDparameter' })
    }

    const filePath = path.join(dataDir, `${id}.json`)

    try {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ code: 404, message: 'file not found' })
        }

        const result = await getStageData(filePath)

        if (!result.valid) {
            return res.status(500).json({
                code: 500,
                message: `read file ${id}.json failed：${result.error}`,
                errorDetails: result.errorContext,
                errorLine: result.errorLine
            })
        }

        // Get file status，Add time field
        const stats = await fsPromises.stat(filePath)
        const lastModifiedTime = stats.mtime.getTime()

        return res.json({
            code: 200,
            data: {
                ...result.data,
                time: lastModifiedTime // Add time field
            }
        })
    } catch (err) {
        console.error(`failed to get canvas data: ${err.message}`)
        return res.status(500).json({ code: 500, message: `failed to get canvas data: ${err.message}` })
    }
})

// Get list data interface - Already supports thumbnails and publication status
app.get('/test/list', async (req, res) => {
    try {
        // Ensure the data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true })
            return res.json({
                code: 200,
                data: []
            })
        }

        const files = await fsPromises.readdir(dataDir)
        const stageFiles = files.filter((file) => file.endsWith('.json') && !file.includes('_meta'))

        const stageListPromises = stageFiles.map(async (file) => {
            const id = file.replace('.json', '')
            const filePath = path.join(dataDir, file)
            const metaPath = path.join(dataDir, `${id}_meta.json`)

            try {
                // Read main data
                const fileContent = await fsPromises.readFile(filePath, 'utf8')
                let stageData
                try {
                    stageData = JSON.parse(fileContent)
                } catch (parseErr) {
                    console.error(`parse${file}failed`, parseErr)
                    return {
                        id,
                        name: `error file-${id}`,
                        error: true
                    }
                }

                // Read metadata（Contains thumbnails and publication status）
                let metaData = {}
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = await fsPromises.readFile(metaPath, 'utf8')
                        metaData = JSON.parse(metaContent)
                    } catch (err) {
                        console.error(`read${id}metadata failed`, err)
                    }
                }

                // Get file status
                const stats = await fsPromises.stat(filePath)

                return {
                    id,
                    name: stageData.name || `unnamed-${id}`,
                    time: stats.mtime.getTime(),
                    thumbnail: metaData.thumbnail || '',
                    isPublished: metaData.isPublished || false
                }
            } catch (err) {
                console.error(`process file${file}error occurred when`, err)
                return {
                    id,
                    name: `error file-${id}`,
                    error: true
                }
            }
        })

        const stageList = await Promise.all(stageListPromises)

        return res.json({
            code: 200,
            data: stageList
        })
    } catch (err) {
        console.error('failed to get canvas list', err)
        return res.status(500).json({ code: 500, message: 'failed to get list：' + err.message })
    }
})

// Delete canvas data interface 
app.get('/test/delete', async (req, res) => {
    const { id } = req.query

    if (!id) {
        return res.status(400).json({ code: 400, message: 'missingIDparameter' })
    }

    try {
        const filePath = path.join(dataDir, `${id}.json`)
        const metaPath = path.join(dataDir, `${id}_meta.json`)

        // Check if the main file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ code: 404, message: 'file not found' })
        }

        // Delete mainJSONfile
        await fsPromises.unlink(filePath)
        console.log(`file deleted: ${filePath}`)

        // Try to delete metadata file(if it exists)
        if (fs.existsSync(metaPath)) {
            await fsPromises.unlink(metaPath)
            console.log(`metadata file deleted: ${metaPath}`)
        }

        return res.json({
            code: 200,
            message: 'delete successful',
            data: { id }
        })
    } catch (err) {
        console.error(`failed to delete canvas data: ${err.message}`)
        return res.status(500).json({ code: 500, message: `delete failed: ${err.message}` })
    }
})

// Delete image interface
app.delete('/test/deleteImage', async (req, res) => {
    const { id } = req.query

    // Parameter validation
    if (!id) {
        return sendResponse(res, 400, 'missing id parameter')
    }

    const filePath = path.join(uploadsDir, id)

    try {
        // Check if the file exists
        await fsPromises.access(filePath, fs.constants.F_OK)

        // Delete file
        await fsPromises.unlink(filePath)

        return sendResponse(res, 200, 'image deleted successfully')
    } catch (err) {
        if (err.code === 'ENOENT') {
            return sendResponse(res, 404, 'image file not found')
        }
        console.error(err)
        return sendResponse(res, 500, 'failed to delete image')
    }
})
// Start the server
const port = 3000
app.listen(port, () => {
    console.log(`server started，listening on port ${port}`)
    console.log(`data directory path: ${dataDir}`)
})