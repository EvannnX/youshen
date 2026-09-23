# 神殿扫描材质

来源为 Poly Haven，许可证 CC0，可商用和再分发。
许可证：https://polyhaven.com/license

- 地面：https://polyhaven.com/a/slate_floor_03
- 墙面：https://polyhaven.com/a/plastered_wall
- 天花板：https://polyhaven.com/a/dark_wood

每套使用 1K JPEG 颜色、OpenGL 法线和粗糙度贴图，本地加载，不依赖远程运行服务。颜色图使用 sRGB，其余使用线性空间。下载地址记录于 sources.json。重新下载运行 `node tools/fetch-temple-textures.mjs`。

材质由 temple-materials.js 创建，重复次数按建筑实际尺寸设定；灰泥及木材保留暖色调以配合殿内灯光。未使用高细分位移，避免增加移动端几何负担。
