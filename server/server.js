const express = require('express')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const axios = require('axios')
const multer = require('multer')
const app = express()
const dataDir = path.join(__dirname, 'JSON') // 修改为JSON文件夹
// 确保数据目录存在
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
}
// 使用中间件解析 JSON 请求体
app.use(express.json({ limit: '20mb' })) // 增加限制，缩略图可能较大

// 设置静态文件夹，用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// 配置 multer，用于处理文件上传
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

// 优化getStageData函数，更好地处理错误
const getStageData = async (filePath) => {
    try {
        // 检查文件是否存在
        try {
            await fsPromises.access(filePath, fs.constants.F_OK)
        } catch (error) {
            return { valid: false, data: null, error: '文件不存在' }
        }

        // 读取文件内容
        const data = await fsPromises.readFile(filePath, 'utf8')

        // 验证内容
        if (!data || data.trim() === '') {
            return { valid: false, data: null, error: '文件内容为空' }
        }

        // 尝试解析JSON
        try {
            const jsonData = JSON.parse(data)
            return { valid: true, data: jsonData }
        } catch (parseError) {
            console.error(`JSON解析错误: ${parseError.message}`)

            // 获取错误位置信息
            const errorPosition = parseError.message.match(/position (\d+)/)
            const errorLine = parseError.message.match(/line (\d+)/)

            let errorContext = ''
            if (errorPosition && errorPosition[1]) {
                const pos = parseInt(errorPosition[1])
                // 提供错误上下文，帮助调试
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
        console.error(`文件读取错误: ${fileError.message}`)
        return { valid: false, data: null, error: fileError.message }
    }
}


// 文件过滤，限制只接受图片类型
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['.jpeg', '.jpg', '.png', '.gif']
        const ext = path.extname(file.originalname).toLowerCase()
        if (allowedTypes.includes(ext)) {
            cb(null, true)
        } else {
            cb(new Error('只支持 jpg、jpeg、png、gif 格式的图片'))
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为 10MB
    }
})

// 定义统一的响应格式
const sendResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        code: statusCode,
        message,
        data
    })
}

// 上传图片接口
app.post('/test/uploadImage', upload.single('file'), function (req, res) {
    // 检查是否有文件上传
    if (!req.file) {
        return sendResponse(res, 400, '没有上传文件')
    }

    // 构造可访问的图片 URL
    const imageUrl = `/uploads/${req.file.filename}`

    // 返回图片的 URL
    return sendResponse(res, 200, '上传成功', { id: req.file.filename, url: imageUrl })
})

// 获取图片列表接口
app.get('/test/imageList', async (req, res) => {
    try {
        // 确保上传目录存在
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
            return sendResponse(res, 200, '获取图片列表成功', [])
        }

        const files = await fsPromises.readdir(uploadsDir)

        // 构造图片列表，每个图片包含 id 和 URL
        const imageList = files.map((filename) => ({
            id: filename,
            url: `/uploads/${filename}`
        }))

        return sendResponse(res, 200, '获取图片列表成功', imageList)
    } catch (error) {
        console.error(error)
        return sendResponse(res, 500, '获取图片列表失败')
    }
})

// 保存数据接口 
app.post('/test/save', async (req, res) => {
    const { id, stageJson, name, thumbnail, isPublished } = req.body

    if (!id) {
        return res.status(400).json({ code: 400, message: '缺少ID参数' })
    }

    try {
        const filePath = path.join(dataDir, `${id}.json`)
        const metaPath = path.join(dataDir, `${id}_meta.json`)

        // 保存主数据
        const currentTime = Date.now()
        const saveData = {
            id,
            name,
            stageJson,
            lastSavedTime: currentTime
        }

        // 使用 fsPromises 异步写入文件
        await fsPromises.writeFile(filePath, JSON.stringify(saveData, null, 2))

        // 保存元数据（缩略图和发布状态）
        let metaData = {}
        if (fs.existsSync(metaPath)) {
            try {
                const metaContent = await fsPromises.readFile(metaPath, 'utf8')
                metaData = JSON.parse(metaContent)
            } catch (err) {
                console.error('读取元数据失败，创建新元数据', err)
                metaData = {}
            }
        }

        // 更新元数据
        metaData = {
            ...metaData,
            id,
            lastModified: currentTime
        }

        // 仅当提供缩略图时才更新
        if (thumbnail) {
            metaData.thumbnail = thumbnail
        }

        // 仅当明确设置isPublished时才更新
        if (isPublished !== undefined) {
            metaData.isPublished = isPublished
        }

        // 保存元数据文件
        await fsPromises.writeFile(metaPath, JSON.stringify(metaData, null, 2))

        return res.json({
            code: 200,
            message: '保存成功',
            data: {
                lastSavedTime: currentTime
            }
        })
    } catch (err) {
        console.error('保存画布数据失败', err)
        return res.status(500).json({ code: 500, message: '保存失败：' + err.message })
    }
})

// 获取保存的数据接口 - 已支持返回 time 字段
app.get('/test/getData', async (req, res) => {
    const { id } = req.query
    if (!id) {
        return res.status(400).json({ code: 400, message: '缺少ID参数' })
    }

    const filePath = path.join(dataDir, `${id}.json`)

    try {
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ code: 404, message: '文件不存在' })
        }

        const result = await getStageData(filePath)

        if (!result.valid) {
            return res.status(500).json({
                code: 500,
                message: `读取文件 ${id}.json 失败：${result.error}`,
                errorDetails: result.errorContext,
                errorLine: result.errorLine
            })
        }

        // 获取文件状态，添加 time 字段
        const stats = await fsPromises.stat(filePath)
        const lastModifiedTime = stats.mtime.getTime()

        return res.json({
            code: 200,
            data: {
                ...result.data,
                time: lastModifiedTime // 添加 time 字段
            }
        })
    } catch (err) {
        console.error(`获取画布数据失败: ${err.message}`)
        return res.status(500).json({ code: 500, message: `获取画布数据失败: ${err.message}` })
    }
})

// 获取列表数据接口 - 已支持缩略图和发布状态
app.get('/test/list', async (req, res) => {
    try {
        // 确保数据目录存在
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
                // 读取主数据
                const fileContent = await fsPromises.readFile(filePath, 'utf8')
                let stageData
                try {
                    stageData = JSON.parse(fileContent)
                } catch (parseErr) {
                    console.error(`解析${file}失败`, parseErr)
                    return {
                        id,
                        name: `错误文件-${id}`,
                        error: true
                    }
                }

                // 读取元数据（包含缩略图和发布状态）
                let metaData = {}
                if (fs.existsSync(metaPath)) {
                    try {
                        const metaContent = await fsPromises.readFile(metaPath, 'utf8')
                        metaData = JSON.parse(metaContent)
                    } catch (err) {
                        console.error(`读取${id}元数据失败`, err)
                    }
                }

                // 获取文件状态
                const stats = await fsPromises.stat(filePath)

                return {
                    id,
                    name: stageData.name || `未命名-${id}`,
                    time: stats.mtime.getTime(),
                    thumbnail: metaData.thumbnail || '',
                    isPublished: metaData.isPublished || false
                }
            } catch (err) {
                console.error(`处理文件${file}时出错`, err)
                return {
                    id,
                    name: `错误文件-${id}`,
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
        console.error('获取画布列表失败', err)
        return res.status(500).json({ code: 500, message: '获取列表失败：' + err.message })
    }
})

// 删除画布数据接口 
app.get('/test/delete', async (req, res) => {
    const { id } = req.query

    if (!id) {
        return res.status(400).json({ code: 400, message: '缺少ID参数' })
    }

    try {
        const filePath = path.join(dataDir, `${id}.json`)
        const metaPath = path.join(dataDir, `${id}_meta.json`)

        // 检查主文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ code: 404, message: '文件不存在' })
        }

        // 删除主JSON文件
        await fsPromises.unlink(filePath)
        console.log(`已删除文件: ${filePath}`)

        // 尝试删除元数据文件(如果存在)
        if (fs.existsSync(metaPath)) {
            await fsPromises.unlink(metaPath)
            console.log(`已删除元数据文件: ${metaPath}`)
        }

        return res.json({
            code: 200,
            message: '删除成功',
            data: { id }
        })
    } catch (err) {
        console.error(`删除画布数据失败: ${err.message}`)
        return res.status(500).json({ code: 500, message: `删除失败: ${err.message}` })
    }
})

// 删除图片接口
app.delete('/test/deleteImage', async (req, res) => {
    const { id } = req.query

    // 参数校验
    if (!id) {
        return sendResponse(res, 400, '缺少 id 参数')
    }

    const filePath = path.join(uploadsDir, id)

    try {
        // 检查文件是否存在
        await fsPromises.access(filePath, fs.constants.F_OK)

        // 删除文件
        await fsPromises.unlink(filePath)

        return sendResponse(res, 200, '图片删除成功')
    } catch (err) {
        if (err.code === 'ENOENT') {
            return sendResponse(res, 404, '图片文件不存在')
        }
        console.error(err)
        return sendResponse(res, 500, '图片删除失败')
    }
})
// 启动服务器
const port = 3000
app.listen(port, () => {
    console.log(`服务器已启动，监听端口 ${port}`)
    console.log(`数据目录路径: ${dataDir}`)
})