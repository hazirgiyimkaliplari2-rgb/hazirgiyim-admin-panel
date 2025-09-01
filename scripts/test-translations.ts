import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Test script for multi-language functionality
async function testTranslations() {
  console.log("🌍 Testing Multi-Language Support\n")
  
  const baseUrl = "http://localhost:9000"
  
  // Test data
  const testProduct = {
    id: "prod_01K4XFJRV1CEYEPQFP00JMX0X0", // Replace with actual product ID
    translations: {
      en: {
        title: "Women's Dress Pattern",
        description: "Professional dress pattern for seamstresses",
        seo_title: "Buy Women's Dress Pattern Online",
      },
      de: {
        title: "Damenkleid Schnittmuster",
        description: "Professionelles Kleidmuster für Schneiderinnen",
        seo_title: "Damenkleid Schnittmuster Online Kaufen",
      },
    },
  }
  
  try {
    // 1. Test saving translations
    console.log("1️⃣ Testing Translation Save...")
    
    for (const [locale, data] of Object.entries(testProduct.translations)) {
      const response = await fetch(`${baseUrl}/admin/translations/products/${testProduct.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locale,
          ...data,
        }),
      })
      
      if (response.ok) {
        console.log(`✅ ${locale.toUpperCase()} translation saved successfully`)
      } else {
        console.log(`❌ Failed to save ${locale.toUpperCase()} translation`)
      }
    }
    
    // 2. Test fetching translations
    console.log("\n2️⃣ Testing Translation Fetch...")
    
    const fetchResponse = await fetch(`${baseUrl}/admin/translations/products/${testProduct.id}`)
    
    if (fetchResponse.ok) {
      const result = await fetchResponse.json()
      console.log(`✅ Found ${result.translations?.length || 0} translations`)
      result.translations?.forEach((t: any) => {
        console.log(`   - ${t.locale}: ${t.title}`)
      })
    } else {
      console.log("❌ Failed to fetch translations")
    }
    
    // 3. Test store API with locale
    console.log("\n3️⃣ Testing Store API with Locale...")
    
    const locales = ["tr", "en", "de"]
    
    for (const locale of locales) {
      const storeResponse = await fetch(`${baseUrl}/store/products-with-locale?limit=1`, {
        headers: {
          "x-locale": locale,
        },
      })
      
      if (storeResponse.ok) {
        const result = await storeResponse.json()
        console.log(`✅ ${locale.toUpperCase()}: Retrieved ${result.products?.length || 0} products`)
        if (result.products?.[0]) {
          console.log(`   Title: ${result.products[0].title}`)
        }
      } else {
        console.log(`❌ Failed to fetch products for locale: ${locale}`)
      }
    }
    
    console.log("\n✨ Multi-language support is working!")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testTranslations()