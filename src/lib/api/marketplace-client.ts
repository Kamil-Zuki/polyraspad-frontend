import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import type {
  ProductDto,
  ProductReviewDto,
  CardPreviewDto,
  PaginatedResponseDto,
  MarketplaceSearchParams,
} from "./types";

export class MarketplaceClient extends BaseApiClient {
  async getProducts(
    params: MarketplaceSearchParams = {}
  ): Promise<PaginatedResponseDto<ProductDto>> {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set("query", params.query);
    if (params.tags) searchParams.set("tags", params.tags);
    if (params.minPrice != null) searchParams.set("minPrice", String(params.minPrice));
    if (params.maxPrice != null) searchParams.set("maxPrice", String(params.maxPrice));
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.pageNumber != null) searchParams.set("pageNumber", String(params.pageNumber));
    if (params.pageSize != null) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    const url = query ? `${API_ENDPOINTS.MARKETPLACE.PRODUCTS}?${query}` : API_ENDPOINTS.MARKETPLACE.PRODUCTS;
    return this.request<PaginatedResponseDto<ProductDto>>(url);
  }

  async getProduct(id: string): Promise<ProductDto> {
    return this.request<ProductDto>(API_ENDPOINTS.MARKETPLACE.PRODUCT(id));
  }

  /** Список отзывов по товару (GET; при наличии в API) */
  async getProductReviews(
    productId: string,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<PaginatedResponseDto<ProductReviewDto>> {
    const searchParams = new URLSearchParams();
    if (params?.pageNumber != null) searchParams.set("pageNumber", String(params.pageNumber));
    if (params?.pageSize != null) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.MARKETPLACE.PRODUCT_REVIEWS(productId)}?${query}`
      : API_ENDPOINTS.MARKETPLACE.PRODUCT_REVIEWS(productId);
    return this.request<PaginatedResponseDto<ProductReviewDto>>(url);
  }

  /** Smart Preview (демо): сэмпл карточек товара (SR-MKT-02) */
  async getProductPreview(
    productId: string,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<PaginatedResponseDto<CardPreviewDto>> {
    const searchParams = new URLSearchParams();
    if (params?.pageNumber != null) searchParams.set("pageNumber", String(params.pageNumber));
    if (params?.pageSize != null) searchParams.set("pageSize", String(params.pageSize));
    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.MARKETPLACE.PRODUCT_PREVIEW(productId)}?${query}`
      : API_ENDPOINTS.MARKETPLACE.PRODUCT_PREVIEW(productId);
    return this.request<PaginatedResponseDto<CardPreviewDto>>(url);
  }
}
