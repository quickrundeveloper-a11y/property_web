import Image from "next/image";
import Link from "next/link";
import { Calendar, User } from "lucide-react";
import { notFound } from "next/navigation";

function HindiArticle() {
  const title =
    "प्राइम निवास (Prime Nivaas): रियल एस्टेट की दुनिया में आपके भरोसे का प्रतीक – सपनों के घर से हकीकत तक का सफर";
  const author = "Primenivaas Editorial";
  const date = "Feb 12, 2026";
  const hero = "/logo.png";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-56 md:h-72">
        <Image src={hero} alt={title} fill className="object-contain bg-white" priority />
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-8 py-4 max-w-5xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{title}</h1>
          <div className="flex items-center gap-6 mt-2 text-sm text-gray-700">
            <span className="inline-flex items-center">
              <User className="w-4 h-4 mr-2" />
              {author}
            </span>
            <span className="inline-flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {date}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-10">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">प्रस्तावना: घर की अहमियत और आज का बाजार</h2>
          <p className="text-gray-800 leading-7">
            हर इंसान के जीवन में एक ऐसा पल आता है जब वह अपनी मेहनत की कमाई से एक ऐसी छत चाहता है जिसे वह
            अपना कह सके। घर सिर्फ ईंट-पत्थर का ढांचा नहीं होता, बल्कि यह भावनाओं, सुरक्षा और भविष्य के
            निवेश का प्रतीक है। लेकिन आज के दौर में, जहाँ रियल एस्टेट का बाजार तेजी से फैल रहा है, एक आम
            आदमी के लिए सही प्रॉपर्टी का चुनाव करना किसी भूलभुलैया से कम नहीं है। धोखेबाजी, छिपे हुए चार्ज,
            और गलत लोकेशन जैसी समस्याओं के बीच एक ऐसे साथी की जरूरत होती है जो पारदर्शी और अनुभवी हो। यहीं
            पर प्राइम निवास एक मार्गदर्शक के रूप में आपकी मदद करता है।
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. प्राइम निवास क्या है? (एक परिचय)</h3>
          <p className="text-gray-800 leading-7">
            प्राइम निवास एक अग्रणी रियल एस्टेट कंसल्टेंसी और सर्विस प्रोवाइडर है, जिसका मुख्य उद्देश्य
            ग्राहकों को उनकी आवश्यकता, बजट और पसंद के अनुसार बेहतरीन प्रॉपर्टी विकल्प प्रदान करना है। चाहे
            आप शहर के बीचों-बीच एक प्रीमियम प्लॉट की तलाश में हों, बना-बनाया आलीशान घर चाहते हों, या फिर एक
            राजसी विला के मालिक बनना चाहते हों—प्राइम निवास हर कदम पर आपके साथ खड़ा है।
          </p>
          <p className="text-gray-800 leading-7">
            हमारा मानना है कि हर ग्राहक की जरूरत अलग होती है। कोई निवेश (Investment) के लिए जमीन चाहता है, तो
            कोई तुरंत रहने के लिए घर। प्राइम निवास इन सभी विविध जरूरतों को एक ही छत के नीचे पूरा करने की
            क्षमता रखता है।
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. हमारी प्रमुख सेवाएँ: हम क्या प्रदान करते हैं?</h3>
          <ul className="list-disc pl-6 text-gray-800 space-y-2">
            <li>
              <strong>प्रीमियम प्लॉट्स की बिक्री:</strong> विकसित और विकासशील क्षेत्रों में ऐसे प्लॉट्स जिनकी
              भविष्य में कीमत बढ़ने की संभावना अधिक है—सरकारी नियमों के अनुकूल और विवाद-मुक्त।
            </li>
            <li>
              <strong>सपनों का घर और फ्लैट्स:</strong> रेडी-टू-मूव घरों की विस्तृत रेंज, आधुनिक वास्तुकला,
              बेहतर वेंटिलेशन और मजबूती के साथ।
            </li>
            <li>
              <strong>लग्जरी विला:</strong> प्राइवेसी और भव्यता को प्राथमिकता देने वालों के लिए विला
              प्रोजेक्ट्स—निजी गार्डन, पार्किंग और अत्याधुनिक सुविधाएँ।
            </li>
            <li>
              <strong>किराए पर लेने की सुविधा:</strong> हर बजट में घर/ऑफिस किराए पर लेने के विकल्प—रेंट
              सेक्शन से देखें।
            </li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. प्राइम निवास ही क्यों? (हमारी विशेषताएँ)</h3>
          <ul className="list-disc pl-6 text-gray-800 space-y-2">
            <li>प्राइम लोकेशंस: बिजली, सड़क, पानी, स्कूल और अस्पताल जैसी सुविधाओं वाले क्षेत्रों में चयन।</li>
            <li>पारदर्शिता: कोई हिडन कॉस्ट नहीं—जो दिखाया जाता है, वही दिया जाता है।</li>
            <li>कानूनी सुरक्षा: दस्तावेजों की गहन जांच ताकि भविष्य में कोई कानूनी अड़चन न आए।</li>
            <li>विशेषज्ञ सलाह: बाजार के रुझानों पर सही मार्गदर्शन।</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. अपनी प्रॉपर्टी बेचना या लिस्ट करना हुआ आसान</h3>
          <p className="text-gray-800 leading-7">
            अपनी प्रॉपर्टी बेचना या किराए पर देना अब आसान है—वेबसाइट पर पोस्ट करें और नेटवर्क के जरिए सही डील
            पाएँ।
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. रियल एस्टेट में निवेश: क्यों है यह सही समय?</h3>
          <p className="text-gray-800 leading-7">
            बुनियादी ढाँचे का विकास, नए एक्सप्रेसवे और स्मार्ट सिटी प्रोजेक्ट्स के कारण जमीनों की कीमतें बढ़
            रही हैं—प्राइम निवास के साथ निवेश भविष्य को सुरक्षित बनाता है।
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. प्रॉपर्टी खरीदने की प्रक्रिया: आसान सफर</h3>
          <ul className="list-disc pl-6 text-gray-800 space-y-2">
            <li>परामर्श</li>
            <li>साइट विजिट</li>
            <li>दस्तावेजीकरण</li>
            <li>पजेशन</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. प्राइम निवास का विजन और मिशन</h3>
          <p className="text-gray-800 leading-7">
            मिशन: हर परिवार को सुरक्षित, आधुनिक और सम्मानजनक निवास। विजन: भारत का सबसे भरोसेमंद रियल एस्टेट
            प्लेटफॉर्म।
          </p>

          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. निष्कर्ष</h3>
          <p className="text-gray-800 leading-7">
            प्रॉपर्टी खरीदना बड़ा निर्णय है—प्राइम निवास विशेषज्ञता, अनुभव और सुरक्षा प्रदान करता है ताकि सपना
            घर हकीकत बने।
          </p>

          <div className="mt-8 space-y-2 text-gray-800">
            <p>
              मुख्य वेबसाइट: <Link href="https://www.primenivaas.com" className="text-blue-600">www.primenivaas.com</Link>
            </p>
            <p>
              किराए पर प्रॉपर्टी देखें: <Link href="/home?filter=Rent" className="text-blue-600">प्राइम निवास रेंट</Link>
            </p>
            <p>
              अपनी प्रॉपर्टी लिस्ट करें: <Link href="/post-property" className="text-blue-600">पोस्ट प्रॉपर्टी</Link>
            </p>
          </div>
        </div>
        <div className="mt-10">
          <Link href="/blog" className="text-blue-600 font-medium">← Back to Blog</Link>
        </div>
      </div>
    </div>
  );
}

export default function BlogSlugPage({ params }: { params: { slug: string } }) {
  const normalized = decodeURIComponent(params.slug || "").trim().replace(/\u2013/g, "-").toLowerCase();
  const accepted = [
    "prime-nivaas-real-estate-symbol-of-your-trust-journey-from-dream-homes-to-reality",
    "prime-nivas-real-estate-symbol-of-your-trust-journey-from-dream-homes-to-reality"
  ];
  if (accepted.includes(normalized)) return <HindiArticle />;
  return notFound();
}
