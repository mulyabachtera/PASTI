"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcrypt"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var password, idTanah1, idTanah2, existingTanah, idRisk1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding database...');
                    return [4 /*yield*/, bcrypt.hash('rahasia123', 10)];
                case 1:
                    password = _a.sent();
                    // 1. Super Admin
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'superadmin@pasti.go.id' },
                            update: {},
                            create: {
                                email: 'superadmin@pasti.go.id',
                                password: password,
                                name: 'Super Admin PASTI',
                                role: client_1.Role.SUPER_ADMIN,
                            },
                        })];
                case 2:
                    // 1. Super Admin
                    _a.sent();
                    // 2. Admin Pemerintah
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'admin@pasti.go.id' },
                            update: {},
                            create: {
                                email: 'admin@pasti.go.id',
                                password: password,
                                name: 'Admin Instansi',
                                role: client_1.Role.ADMIN_PEMERINTAH,
                            },
                        })];
                case 3:
                    // 2. Admin Pemerintah
                    _a.sent();
                    // 3. Vendor Swasta
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'vendor@swasta.com' },
                            update: {},
                            create: {
                                email: 'vendor@swasta.com',
                                password: password,
                                name: 'Vendor Aset',
                                role: client_1.Role.VENDOR_SWASTA,
                            },
                        })];
                case 4:
                    // 3. Vendor Swasta
                    _a.sent();
                    idTanah1 = 'LND-AT-01';
                    idTanah2 = 'LND-AT-02';
                    return [4 /*yield*/, prisma.tanah.findFirst({ where: { nibar: 'NIBAR-AT-001' } })];
                case 5:
                    existingTanah = _a.sent();
                    if (!!existingTanah) return [3 /*break*/, 10];
                    console.log('Inserting Mock Tanah Data (Aceh Tengah)...');
                    // Tanah 1: Kantor Bupati Aceh Tengah (Takengon) - Presisi
                    return [4 /*yield*/, prisma.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      INSERT INTO \"tanah\" (id, \"kodeLokasi\", \"kodeBarang\", nibar, \"namaBarang\", luas, \"statusHak\", \"createdAt\", \"updatedAt\", \"koordinatPolygon\")\n      VALUES (\n        ", ", 'LOK-AT-01', 'BRG-AT-01', 'NIBAR-AT-001', 'Lahan Kantor Bupati Aceh Tengah', 15000.0, 'Hak Pakai', NOW(), NOW(),\n        ST_GeomFromText('POLYGON((96.840742 4.630449, 96.841578 4.630267, 96.841267 4.629230, 96.840398 4.629433, 96.840742 4.630449))', 4326)\n      )\n    "], ["\n      INSERT INTO \"tanah\" (id, \"kodeLokasi\", \"kodeBarang\", nibar, \"namaBarang\", luas, \"statusHak\", \"createdAt\", \"updatedAt\", \"koordinatPolygon\")\n      VALUES (\n        ", ", 'LOK-AT-01', 'BRG-AT-01', 'NIBAR-AT-001', 'Lahan Kantor Bupati Aceh Tengah', 15000.0, 'Hak Pakai', NOW(), NOW(),\n        ST_GeomFromText('POLYGON((96.840742 4.630449, 96.841578 4.630267, 96.841267 4.629230, 96.840398 4.629433, 96.840742 4.630449))', 4326)\n      )\n    "])), idTanah1)];
                case 6:
                    // Tanah 1: Kantor Bupati Aceh Tengah (Takengon) - Presisi
                    _a.sent();
                    // Tanah 2: Area Wisata Pesisir Danau Laut Tawar - Bentuk Meliuk (Irregular)
                    return [4 /*yield*/, prisma.$executeRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      INSERT INTO \"tanah\" (id, \"kodeLokasi\", \"kodeBarang\", nibar, \"namaBarang\", luas, \"statusHak\", \"createdAt\", \"updatedAt\", \"koordinatPolygon\")\n      VALUES (\n        ", ", 'LOK-AT-02', 'BRG-AT-02', 'NIBAR-AT-002', 'Aset Wisata Pesisir Laut Tawar', 45000.0, 'Hak Pengelolaan', NOW(), NOW(),\n        ST_GeomFromText('POLYGON((96.8520 4.6240, 96.8525 4.6238, 96.8532 4.6234, 96.8535 4.6225, 96.8529 4.6215, 96.8518 4.6212, 96.8510 4.6218, 96.8505 4.6225, 96.8508 4.6235, 96.8515 4.6239, 96.8520 4.6240))', 4326)\n      )\n    "], ["\n      INSERT INTO \"tanah\" (id, \"kodeLokasi\", \"kodeBarang\", nibar, \"namaBarang\", luas, \"statusHak\", \"createdAt\", \"updatedAt\", \"koordinatPolygon\")\n      VALUES (\n        ", ", 'LOK-AT-02', 'BRG-AT-02', 'NIBAR-AT-002', 'Aset Wisata Pesisir Laut Tawar', 45000.0, 'Hak Pengelolaan', NOW(), NOW(),\n        ST_GeomFromText('POLYGON((96.8520 4.6240, 96.8525 4.6238, 96.8532 4.6234, 96.8535 4.6225, 96.8529 4.6215, 96.8518 4.6212, 96.8510 4.6218, 96.8505 4.6225, 96.8508 4.6235, 96.8515 4.6239, 96.8520 4.6240))', 4326)\n      )\n    "])), idTanah2)];
                case 7:
                    // Tanah 2: Area Wisata Pesisir Danau Laut Tawar - Bentuk Meliuk (Irregular)
                    _a.sent();
                    idRisk1 = 'RSK-AT-001';
                    return [4 /*yield*/, prisma.$executeRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      INSERT INTO \"risk_register\" (id, \"idTanah\", \"kategoriRisiko\", \"deskripsiRisiko\", \"skorDampak\", \"skorPeluang\", \"skorTotal\", \"tingkatRisiko\", \"createdAt\", \"updatedAt\", \"koordinatTitik\")\n      VALUES (\n        ", ", ", ", 'Sosial/Batas', 'Sengketa batas pagar belakang dengan permukiman warga', 5, 4, 20, 'Extreme', NOW(), NOW(),\n        ST_GeomFromText('POINT(96.84065 4.62935)', 4326)\n      )\n    "], ["\n      INSERT INTO \"risk_register\" (id, \"idTanah\", \"kategoriRisiko\", \"deskripsiRisiko\", \"skorDampak\", \"skorPeluang\", \"skorTotal\", \"tingkatRisiko\", \"createdAt\", \"updatedAt\", \"koordinatTitik\")\n      VALUES (\n        ", ", ", ", 'Sosial/Batas', 'Sengketa batas pagar belakang dengan permukiman warga', 5, 4, 20, 'Extreme', NOW(), NOW(),\n        ST_GeomFromText('POINT(96.84065 4.62935)', 4326)\n      )\n    "])), idRisk1, idTanah1)];
                case 8:
                    _a.sent();
                    // 6. Mock Data Action Plan
                    return [4 /*yield*/, prisma.actionPlan.create({
                            data: {
                                idRisiko: idRisk1,
                                rencanaMitigasi: 'Pengukuran ulang oleh BPN Aceh Tengah dan mediasi warga',
                                pic: 'Dinas Pertanahan Aceh Tengah',
                                targetSelesai: new Date('2026-11-10'),
                                biayaEstimasi: 15000000,
                                statusAksi: 'Open'
                            }
                        })];
                case 9:
                    // 6. Mock Data Action Plan
                    _a.sent();
                    _a.label = 10;
                case 10:
                    console.log('Seeding completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var templateObject_1, templateObject_2, templateObject_3;
