import request from '../axios'

// 保存画布数据
export async function saveStageData(params) {
    return request.post('/test/save', { ...params })
}
// 删除画布数据
export async function deleteStageData(params) {
    return request.get('/test/delete', { params: params })
}
// 获取画布数据
export async function getStageData(params) {
    return request.get('/test/getData', { params: params })
}
// 获取画布数据列表
export async function getStageDataList(params) {
    return request.get('/test/list', { params: params })
}
// 上传图片
export async function uploadSystemImg(file) {
    return request.post('/test/uploadImage', file)
}
// 获取已上传图片列表
export async function getSystemImgList(params) {
    return request.get('/test/imageList', {
        params
    })
}
// 删除图片
export async function deleteSystemImg(params) {
    return request.delete('/test/deleteImage', {
        params
    })
}