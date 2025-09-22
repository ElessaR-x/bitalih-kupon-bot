import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    const { raceId } = await params

    if (!raceId) {
      return NextResponse.json(
        { error: 'Race ID gerekli' },
        { status: 400 }
      )
    }

    // Bitalih API'sine istek yap
    const response = await fetch(
      `https://www.bitalih.com/api/tjk/race/${raceId}/bulletin`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Origin': 'https://www.bitalih.com',
          'Referer': 'https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/greyville-guney-afrika',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'Accept-Language': 'tr-TR,tr;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Priority': 'u=1, i',
          'Cookie': '_gcl_au=1.1.96631517.1758110462; _ga=GA1.1.327758038.1758110446; _fbp=fb.1.1758110719848.655979332806927605; _tt_enable_cookie=1; _ttp=01K5BS17XYPQSK9DWB6YSG3M5J_.tt.1; _ym_uid=1758110720675645929; _ym_d=1758110720; platform=web; popup_history=%7B%2229%22%3A%7B%22timestamp%22%3A1758112335866%2C%22expires%22%3A1765888335866%7D%2C%2230%22%3A%7B%22timestamp%22%3A1758204051554%2C%22expires%22%3A1765980051554%7D%2C%2235%22%3A%7B%22timestamp%22%3A1758477765169%2C%22expires%22%3A1766253765169%7D%7D; LaVisitorNew=Y; LaVisitorId_Yml0YWxpaC5sYWRlc2suY29tLw=2lmkghkw9617hlkby8ka9pijaok4xlfu; LaSID=drd7x6bztucsgxfmu74sxr15q274hl71; _ym_isad=2; bth_valid_until=1758480598600; _clsk=1nwmq4e%5E1758480370349%5E22%5E1%5Ez.clarity.ms%2Fcollect; _clck=qyj9sz%5E2%5Efzj%5E0%5E2086; LaUserDetails=%7B%7D; ttcsid=1758530267235::EaBxeZ0Ls1vAuWcJEAAP.5.1758530269463.0; MgidSensorNVis=126; MgidSensorHref=https://www.bitalih.com/at-yarisi/tjk-sabit-ihtimalli-bahis/durbanville-guney-afrika; ttcsid_CUBLMERC77UALAVP2M10=1758530264565::DIb44W9MtraqtE8FRpLP.5.1758530269850.0; _ym_visorc=w; _ga_0E4P7ZF1VD=GS2.1.s1758530264$o5$g1$t1758530270$j54$l0$h1501257402'
        },
        body: JSON.stringify({ type: 'fob' })
      }
    )

    if (!response.ok) {
      console.error(`Bitalih API hatası: ${response.status}`)
      return NextResponse.json(
        { error: 'Bitalih API\'sinden veri alınamadı' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(
        { error: 'API başarısız yanıt döndü' },
        { status: 400 }
      )
    }

    // Mevcut ayak numaralarını çıkar
    const raceData = data.data?.race
    if (!raceData || !raceData.runs) {
      return NextResponse.json(
        { error: 'Yarış verisi bulunamadı' },
        { status: 404 }
      )
    }

    const raceNumbers = raceData.runs
      .map((run: any) => run.number)
      .filter((num: number) => num != null)
      .sort((a: number, b: number) => a - b)

    return NextResponse.json({
      success: true,
      race_id: parseInt(raceId),
      race_numbers: raceNumbers,
      total_races: raceNumbers.length
    })

  } catch (error) {
    console.error('Bulletin API hatası:', error)
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    )
  }
}
