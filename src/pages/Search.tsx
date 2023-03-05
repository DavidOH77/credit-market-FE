import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import PageTitle from '@/components/common/PageTitle';
import Input from '@/components/common/Input';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from '@/store/loadingSlice';
import { MESSAGES } from '@/constants/messages';
import ProductCard from '@/components/Product/ProductCard';
import { IProduct } from '@/interfaces/product';
import { getCookie } from '@/utils/cookie';
import { setSearch } from '@/store/searchSlice';
import { axiosInstance } from '@/apis/instance';
import { API_URLS } from '@/constants/apiUrls';
import { RootState } from '@/store/store';
import { ISearch, SelectedValuesType } from '@/interfaces/search';
import Button from '@/components/common/Button';
import { useRef, forwardRef, useImperativeHandle } from 'react';
import { BsArrowUpLeft } from 'react-icons/bs';
import { MdOutlineSearch } from 'react-icons/md';
import {
  getAutoSearch,
  getRandomSearchList,
  getRecommentList,
  getSearchList,
} from '@/apis/product';
import { useCookies } from 'react-cookie';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Global, css } from '@emotion/react';
import COLORS from '@/styles/colors';

const Search = () => {
  const dispatch = useDispatch();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchForm, setSearchForm] = useState({});
  const [searchToggle, setsearchToggle] = useState(false);
  const [cookies, setCookie] = useCookies();

  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      buttonRef.current?.click();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClick = () => {
    setSearchForm({ ...searchForm, keyword: searchQuery });
  };

  const [products, setProducts] = useState<IProduct[]>([]);
  const userName = getCookie('userName');

  useEffect(() => {
    async function getProducts() {
      try {
        dispatch(showLoading());
        cookies.userName
          ? setProducts(await getRecommentList())
          : setProducts(await getRandomSearchList());
      } catch (error) {
        alert(MESSAGES.PRODUCT.ERROR_GET_PRODUCT);
      } finally {
        dispatch(hideLoading());
      }
    }
    getProducts();
  }, [cookies]);

  // 검색 결과 리스트
  const getProducts = async () => {
    try {
      dispatch(showLoading());
      const data = { ...searchForm, keyword: searchQuery, page: page };
      const response: IProduct[] = await getSearchList(data);
      try {
        setProducts(response);
      } catch (err) {
        console.log(err);
      }
    } catch (error: any) {
    } finally {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    getProducts();
  }, [searchForm]);

  const [selectedValues, setSelectedValues] = useState<SelectedValuesType>({});
  const handleSelectChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValues({
      ...selectedValues,
      [event.target.name]: event.target.value,
    });
  };

  useEffect(() => {
    const {
      loan = '',
      age = '',
      gender = '',
      interest = '',
    } = {
      loan: selectedValues.loan,
      age: selectedValues.age,
      gender: selectedValues.sex,
      interest: selectedValues.interest,
    };
    setSearchForm({ ...searchForm, loan, age, gender, interest });
  }, [selectedValues]);

  const initializeHandler = async () => {
    setSearchQuery('');
    setSearchForm({});
    setSelectedValues({
      loan: '',
      age: '',
      interest: '',
      sex: '',
    });
    try {
      dispatch(showLoading());
      if (userName) {
        setProducts(await getRecommentList());
      } else {
        setProducts(await getRandomSearchList());
      }
    } catch (error) {
      alert(MESSAGES.PRODUCT.ERROR_GET_PRODUCT);
    } finally {
      dispatch(hideLoading());
    }
  };

  //infinite scroll
  const [page, setPage] = useState(1);
  const fetchData = () => {
    setPage(page + 1);
    try {
      dispatch(showLoading());
      setTimeout(async () => {
        const data = { ...searchForm, keyword: searchQuery, page: page + 1 };
        const response = await getSearchList(data);
        const newData: IProduct[] = response;
        setProducts([...products, ...newData]);
      }, 1500);
    } catch (error: any) {
    } finally {
      dispatch(hideLoading());
    }
  };

  // auto search
  const [autoItems, setAutoItems] = useState<[]>([]);
  const autoSearch = async () => {
    try {
      if (searchQuery != '') {
        const res: [] = await getAutoSearch({ prefix: searchQuery });
        setAutoItems(res);
      }
    } catch (error) {
      alert(MESSAGES.PRODUCT.ERROR_GET_PRODUCT);
    }
  };

  useEffect(() => {
    setsearchToggle(true);
    const debounce = setTimeout(() => {
      autoSearch();
    }, 200);
    return () => {
      clearTimeout(debounce);
    };
  }, [searchQuery]);

  return (
    <StyledSearch>
      <PageTitle title="상품 검색" />
      <div className="searchArea">
        <div css={SearchStyle}>
          <Input
            onKeyDown={handleKeyDown}
            inputType="text"
            placeholder="검색어를 입력해 주세요."
            onChange={handleChange}
            onButtonClick={handleClick}
            classType="text-search"
            autoFocus
            refInput={buttonRef}
            value={searchQuery}
            onBlur={() => {
              setsearchToggle(false);
            }}
            onFocus={() => {
              setsearchToggle(true);
            }}
          />
          {autoItems.length > 0 &&
            searchToggle &&
            searchQuery && ( //키워드가 존재하고,해당키워드에 맞는 이름이 있을때만 보여주기
              <AutoContainer>
                <AutoSearchWrap>
                  {autoItems.map((autoItem: string, idx: number) => (
                    <SearchItem
                      key={idx}
                      onMouseDown={() => {
                        setSearchQuery(autoItem);
                        handleClick();
                      }}
                    >
                      <MdOutlineSearch css={SearchCircle} />
                      <SearchWord>
                        <span>{autoItem}</span>
                        <BsArrowUpLeft />
                      </SearchWord>
                    </SearchItem>
                  ))}
                </AutoSearchWrap>
              </AutoContainer>
            )}
          <div className="selectBox">
            <select name="loan" value={selectedValues.loan} onChange={handleSelectChange}>
              <option value="">대출종류</option>
              <option value="일반신용대출">일반신용대출</option>
              <option value="마이너스한도대출">마이너스한도대출</option>
              <option value="장기카드대출(카드론)">장기카드대출</option>
            </select>
            <select name="age" value={selectedValues.age} onChange={handleSelectChange}>
              <option value="">최소나이</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
            </select>
            <select name="sex" value={selectedValues.sex} onChange={handleSelectChange}>
              <option value="">대상성별</option>
              <option value="남">남성</option>
              <option value="여">여성</option>
            </select>
            <select name="interest" value={selectedValues.interest} onChange={handleSelectChange}>
              <option value="">금리유형</option>
              <option value="대출금리">대출금리</option>
              <option value="기준금리">기준금리</option>
              <option value="가산금리">가산금리</option>
            </select>
            <Button
              height="auto"
              onClick={() => {
                initializeHandler();
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      <ul className="productsArea" id="scrollable">
        <InfiniteScroll
          dataLength={products.length}
          next={fetchData}
          hasMore={true}
          loader={''}
          scrollableTarget="scrollable"
        >
          <Global
            styles={css`
              .infinite-scroll-component::-webkit-scrollbar {
                display: none; /* Chrome, Safari, Opera*/
              }
            `}
          />
          {products.length > 0 &&
            products.map((product) => <ProductCard key={product.productId} data={product} />)}
        </InfiniteScroll>
      </ul>
    </StyledSearch>
  );
};

export default Search;

const AutoContainer = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const AutoSearchWrap = styled.div`
  background: white;
  border: 1px solid black;
  border-radius: 4px;
  width: 93%;
  z-index: 1000;
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: space-between;
  padding: 0.2rem;
`;

const SearchItem = styled.div`
  padding: 0.4rem;
  cursor: pointer;
  display: flex;

  align-items: center;
  border-radius: 4px;
  &:hover {
    background: ${COLORS.lightGray};
  }
`;

const SearchStyle = css`
  position: relative;
`;

const SearchWord = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
`;
const SearchCircle = css`
  margin-right: 1rem;
`;

const StyledSearch = styled.div`
  padding: 0 0 0 10px;
  height: 100%;

  .searchArea {
    padding-right: 10px;
  }

  .selectBox {
    gap: 2px;
    > button {
      border-radius: 5px;
      margin-left: 8px;
      font-size: 11px;
      font-weight: bold;
    }
  }

  .infinite-scroll-component {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .productsArea {
    height: calc(100% - 170px);
    padding-right: 10px;
    overflow-y: auto;
  }
`;
