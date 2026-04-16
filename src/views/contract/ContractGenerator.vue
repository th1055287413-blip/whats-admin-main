<template>
  <div class="contract-page">
    <!-- 生成表单 -->
    <el-card class="mb-4">
      <template #header>生成合同</template>
      <el-form :model="form" label-width="120px">
        <el-divider>买方信息</el-divider>
        <el-form-item label="公司名称">
          <el-input v-model="form.buyer.name" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.buyer.address" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.buyer.contactPerson" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.buyer.email" />
        </el-form-item>
        <el-form-item label="WhatsApp">
          <el-input v-model="form.buyer.whatsapp" />
        </el-form-item>

        <el-divider>商品信息</el-divider>
        <div v-for="(product, index) in form.products" :key="index" class="product-item">
          <el-row :gutter="10">
            <el-col :span="5">
              <el-input v-model="product.name" placeholder="商品名称" />
            </el-col>
            <el-col :span="6">
              <el-input v-model="product.description" placeholder="描述" />
            </el-col>
            <el-col :span="3">
              <el-select v-model="product.unit" placeholder="单位">
                <el-option label="pcs" value="pcs" />
                <el-option label="set" value="set" />
                <el-option label="box" value="box" />
                <el-option label="unit" value="unit" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-input-number v-model="product.price" placeholder="单价" :min="0" />
            </el-col>
            <el-col :span="3">
              <el-input-number v-model="product.quantity" placeholder="数量" :min="1" />
            </el-col>
            <el-col :span="2">
              <el-button type="danger" @click="removeProduct(index)">删除</el-button>
            </el-col>
          </el-row>
        </div>
        <el-button @click="addProduct">添加商品</el-button>

        <el-divider>贸易条款</el-divider>
        <el-form-item label="贸易术语">
          <el-input v-model="form.tradeTerms.incoterms" placeholder="如: FOB Shanghai" />
        </el-form-item>
        <el-form-item label="装运港">
          <el-input v-model="form.tradeTerms.portOfLoading" />
        </el-form-item>
        <el-form-item label="目的港">
          <el-input v-model="form.tradeTerms.portOfDestination" />
        </el-form-item>
        <el-form-item label="交货日期">
          <el-input v-model="form.tradeTerms.deliveryDate" placeholder="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="分批装运">
          <el-input v-model="form.tradeTerms.partialShipment" placeholder="允许/不允许" />
        </el-form-item>

        <el-divider>付款条款</el-divider>
        <el-form-item label="预付比例">
          <el-input v-model="form.paymentTerms.advancePercent" placeholder="如: 30%" />
        </el-form-item>
        <el-form-item label="预付天数">
          <el-input v-model="form.paymentTerms.advanceDays" placeholder="如: 7" />
        </el-form-item>
        <el-form-item label="余款比例">
          <el-input v-model="form.paymentTerms.balancePercent" placeholder="如: 70%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-input v-model="form.paymentTerms.method" placeholder="如: T/T" />
        </el-form-item>
        <el-form-item label="开户行">
          <el-input v-model="form.paymentTerms.bankName" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="form.paymentTerms.accountNo" />
        </el-form-item>
        <el-form-item label="SWIFT Code">
          <el-input v-model="form.paymentTerms.swiftCode" />
        </el-form-item>

        <el-form-item label="备注" class="mt-4">
          <el-input v-model="form.notes" type="textarea" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="generateContract" :loading="loading">生成链接</el-button>
          <el-button type="success" @click="showSampleDialog" :loading="sampleLoading">AI 生成样本</el-button>
        </el-form-item>
      </el-form>

      <el-alert v-if="generatedUrl" type="success" :closable="false" class="mt-4">
        <template #title>
          <div>生成成功！</div>
          <div class="url-display">
            <el-input v-model="generatedUrl" readonly />
            <el-button @click="copyUrl(generatedUrl)">复制</el-button>
          </div>
        </template>
      </el-alert>
    </el-card>

    <!-- 合同列表 -->
    <el-card>
      <template #header>合同列表</template>
      <el-table :data="contracts" v-loading="listLoading">
        <el-table-column prop="id" label="合同ID" width="200" />
        <el-table-column label="公司名称" width="150">
          <template #default="{ row }">
            {{ getCompanyName(row) }}
          </template>
        </el-table-column>
        <el-table-column label="验证状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getVerified(row) ? 'success' : 'warning'">
              {{ getVerified(row) ? '已验证' : '未验证' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="400">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-select v-model="row.selectedDomain" placeholder="域名" size="small" style="width: 120px; margin: 0 5px;">
              <el-option label="con" value="con.whatswoo.org" />
            </el-select>
            <el-button size="small" @click="copyContractUrl(row.id, row.selectedDomain)">复制链接</el-button>
            <el-button size="small" type="danger" @click="deleteContract(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="合同详情" width="800px">
      <div v-if="currentContract">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合同ID">{{ currentContract.id }}</el-descriptions-item>
          <el-descriptions-item label="验证状态">
            <el-tag :type="getVerified(currentContract) ? 'success' : 'warning'">
              {{ getVerified(currentContract) ? '已验证' : '未验证' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentContract.created_at }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ getPayload(currentContract).currency || 'CNY' }} {{ getPayload(currentContract).total || 0 }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>买方信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="公司名称">{{ getPayload(currentContract).buyer?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ getPayload(currentContract).buyer?.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ getPayload(currentContract).buyer?.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="WhatsApp">{{ getPayload(currentContract).buyer?.whatsapp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ getPayload(currentContract).buyer?.address || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>卖方信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="公司名称">{{ getPayload(currentContract).seller?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ getPayload(currentContract).seller?.contactPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ getPayload(currentContract).seller?.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="WhatsApp">{{ getPayload(currentContract).seller?.whatsapp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ getPayload(currentContract).seller?.address || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider>商品列表</el-divider>
        <el-table :data="getPayload(currentContract).products" border>
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="price" label="单价" width="100" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="{ row }">
              {{ row.price * row.quantity }}
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-4" style="text-align: right; font-size: 16px; font-weight: bold;">
          总金额: {{ getPayload(currentContract).total }}
        </div>

        <el-divider>合同链接</el-divider>
        <el-input :value="getContractUrl(currentContract.id)" readonly>
          <template #append>
            <el-button @click="copyContractUrl(currentContract.id)">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-dialog>

    <!-- AI 生成样本对话框 -->
    <el-dialog v-model="sampleDialogVisible" title="AI 生成样本" width="500px">
      <el-form>
        <el-form-item label="关键字">
          <el-input v-model="sampleKeyword" placeholder="例如：办公设备、电子产品、家具等" />
        </el-form-item>
        <el-form-item label="语言">
          <el-radio-group v-model="sampleLanguage">
            <el-radio value="zh">中文</el-radio>
            <el-radio value="en">English</el-radio>
            <el-radio value="ms">Bahasa Melayu</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sampleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateSample" :loading="sampleLoading">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const form = ref({
  buyer: { name: '', address: '', contactPerson: '', email: '', whatsapp: '' },
  seller: { name: '', address: '', contactPerson: '', email: '', whatsapp: '' },
  products: [{ name: '', description: '', unit: 'pcs', price: 0, quantity: 1 }],
  tradeTerms: { incoterms: '', portOfLoading: '', portOfDestination: '', deliveryDate: '', partialShipment: '' },
  paymentTerms: { advancePercent: '', advanceDays: '', balancePercent: '', method: '', bankName: '', accountNo: '', swiftCode: '' },
  notes: '',
  domain: 'con.whatswoo.org',
  expiresInDays: 7
})

const loading = ref(false)
const sampleLoading = ref(false)
const generatedUrl = ref('')
const contracts = ref([])
const listLoading = ref(false)
const detailVisible = ref(false)
const currentContract = ref(null)
const sampleDialogVisible = ref(false)
const sampleKeyword = ref('')
const sampleLanguage = ref('zh')

const addProduct = () => {
  form.value.products.push({ name: '', description: '', unit: 'pcs', price: 0, quantity: 1 })
}

const removeProduct = (index) => {
  form.value.products.splice(index, 1)
}

const showSampleDialog = () => {
  sampleDialogVisible.value = true
  sampleKeyword.value = ''
  sampleLanguage.value = 'zh'
}

const generateSample = async () => {
  if (!sampleKeyword.value.trim()) {
    ElMessage.error('请输入关键字')
    return
  }

  sampleLoading.value = true
  try {
    const res = await request.post('/admin/contracts/generate-sample', {
      keyword: sampleKeyword.value,
      language: sampleLanguage.value
    })
    if (res.code === 0) {
      form.value = res.data
      sampleDialogVisible.value = false
      ElMessage.success('样本数据已生成')
    }
  } catch (error) {
    ElMessage.error('生成失败')
  } finally {
    sampleLoading.value = false
  }
}

const generateContract = async () => {
  if (!form.value.buyer.name) {
    ElMessage.error('请填写买方信息')
    return
  }
  for (const product of form.value.products) {
    if (!product.name || product.price <= 0 || product.quantity <= 0) {
      ElMessage.error('请填写完整的商品信息')
      return
    }
  }

  loading.value = true
  try {
    const res = await request.post('/admin/contracts', form.value)
    if (res.code === 0) {
      generatedUrl.value = res.data.url
      ElMessage.success('生成成功')
      fetchContracts()
    }
  } catch (error) {
    ElMessage.error('生成失败')
  } finally {
    loading.value = false
  }
}

const fetchContracts = async () => {
  listLoading.value = true
  try {
    const res = await request.get('/admin/contracts')
    if (res.code === 0) {
      contracts.value = res.data.map(contract => ({
        ...contract,
        selectedDomain: 'con.whatswoo.org'
      }))
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    listLoading.value = false
  }
}

const getCompanyName = (row) => {
  try {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    return payload?.buyer?.name || '-'
  } catch {
    return '-'
  }
}

const getTotal = (row) => {
  try {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    const currency = payload?.currency || 'CNY'
    const total = payload?.total || 0
    return `${currency} ${total}`
  } catch {
    return '0'
  }
}

const getPayload = (contract) => {
  try {
    if (typeof contract.payload === 'string') {
      return JSON.parse(contract.payload)
    }
    return contract.payload || {}
  } catch {
    return {}
  }
}

const getVerified = (row) => {
  try {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    return payload?.verified || false
  } catch {
    return false
  }
}

const viewDetail = (row) => {
  currentContract.value = row
  detailVisible.value = true
}

const copyUrl = (url) => {
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制')
}

const getContractUrl = (id, domain = 'con.whatswoo.org') => {
  return `https://${domain}/?id=${id}`
}

const copyContractUrl = (id, domain = 'con.whatswoo.org') => {
  const url = getContractUrl(id, domain)
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制链接')
}

const deleteContract = async (id) => {
  try {
    const res = await request.delete(`/admin/contracts/${id}`)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchContracts()
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchContracts()
})
</script>

<style scoped>
.contract-page { padding: 20px; }
.product-item { margin-bottom: 20px; }
.url-display { display: flex; gap: 10px; margin-top: 10px; width: 100%; }
.url-display .el-input { flex: 1; }
.mb-4 { margin-bottom: 20px; }
.mt-4 { margin-top: 20px; }
</style>
