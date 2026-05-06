type Entry = {
  id: number
  name: string
  value: string
}

type Datasource = {
  data: {
    datasource_entries: Entry[]
    cv: number
  }
  headers: Record<string, string>
  perPage: number
  total: number
}

export async function useDatasource(slug: string = '', items: (string | number)[] = []) {
  const storyblokApi = useStoryblokApi()

  const { data } = await useAsyncData(
    slug,
    async () =>
      await storyblokApi.get(`cdn/datasource_entries`, {
        datasource: slug,
        per_page: 100,
      }),
  )

  const matched = computed(() => {
    const datasource = data.value as Datasource | undefined
    if (!datasource) return []

    const entries = datasource.data.datasource_entries
    if (!entries) return []

    return items.map((item) => entries.find((entry) => entry.value === item)).filter((entry): entry is Entry => !!entry)
  })

  return matched
}
