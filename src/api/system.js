import request from '../axios'

// Save canvas data
export async function saveStageData(params) {
    return request.post('/test/save', { ...params })
}
// Delete canvas data
export async function deleteStageData(params) {
    return request.get('/test/delete', { params: params })
}
// Get canvas data
export async function getStageData(params) {
    return request.get('/test/getData', { params: params })
}
// Get canvas data list
export async function getStageDataList(params) {
    return request.get('/test/list', { params: params })
}
// Upload image
export async function uploadSystemImg(file) {
    return request.post('/test/uploadImage', file)
}
// Get uploaded image list
export async function getSystemImgList(params) {
    return request.get('/test/imageList', {
        params
    })
}
// Delete image
export async function deleteSystemImg(params) {
    return request.delete('/test/deleteImage', {
        params
    })
}