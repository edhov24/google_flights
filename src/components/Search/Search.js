import React, {useState} from 'react';
import {Form, Button, Row, Col, Dropdown, DropdownButton, Spinner} from 'react-bootstrap';
import {FaChevronDown, FaChevronUp, FaUser} from 'react-icons/fa';
import {IoMdSearch} from "react-icons/io";
import {useForm} from 'react-hook-form';
import moment from "moment";
import axios from "axios";
import './Search.scss';

const FlightSearchForm = () => {
    const {watch, register, handleSubmit} = useForm({
        defaultValues: {
            tripType: 'roundTrip',
        }
    });
    const [passengers, setPassengers] = useState({
        adults: 1,
        children: 0,
        infants: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [flightResults, setFlightResults] = useState(null);
    const [showMoreList, setShowMoreList] = useState(Array(flightResults?.itineraries?.length).fill(false));


    const handlePassengerChange = (type, action) => {
        setPassengers((prev) => {
            const newValue = action === 'increase' ? prev[type] + 1 : prev[type] > 0 ? prev[type] - 1 : 0;
            return {...prev, [type]: newValue};
        });
    };

    const toggleMoreInfo = (index) => {
        setShowMoreList((prevState) => {
            const newShowMoreList = [...prevState];
            newShowMoreList[index] = !newShowMoreList[index];
            return newShowMoreList;
        });
    };

    const fetchLocationIds = async (location) => {
        try {
            const response = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport', {
                headers: {
                    'X-RapidAPI-Key': '06af8e5524msh3f78a6a5b5a1d76p1c8824jsn9729e7f5cfb8',
                    'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
                },
                params: {
                    query: location
                }
            });

            if (response?.data && response?.data?.data?.length > 0 && response?.data?.status) {
                const data = response?.data?.data[0];
                return {
                    skyId: data?.skyId,
                    entityId: data?.entityId
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching location IDs:', error);
            return null;
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        flightResults && setFlightResults(null)
        try {
            const formattedDepartureDate = data.departureDate ? moment(data?.departureDate).format("YYYY-MM-DD") : null;
            const formattedReturnDate = data.returnDate ? moment(data?.returnDate).format("YYYY-MM-DD") : undefined;
            const searchData = {
                ...data,
                passengers,
                departureDate: formattedDepartureDate ? formattedDepartureDate : null,
                returnDate: formattedReturnDate ? formattedReturnDate : null,
            };

            const originIds = await fetchLocationIds(data.from);
            const destinationIds = await fetchLocationIds(data.to);

            if (!originIds || !destinationIds) {
                console.error('Invalid origin or destination IDs');
                setIsLoading(false);
                return;
            }

            const response = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights', {
                headers: {
                    'X-RapidAPI-Key': '06af8e5524msh3f78a6a5b5a1d76p1c8824jsn9729e7f5cfb8',
                    'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com'
                },
                params: {
                    originSkyId: originIds.skyId,
                    destinationSkyId: destinationIds.skyId,
                    originEntityId: originIds.entityId,
                    destinationEntityId: destinationIds.entityId,
                    cabinClass: searchData.classType || 'economy',
                    date: searchData.departureDate,
                    returnDate: searchData.returnDate || undefined,
                    adults: searchData.passengers.adults || 1,
                    children: searchData.passengers.children || 0,
                    infants: searchData.passengers.infants || 0,
                    tripType: searchData.tripType || 'roundTrip',
                }
            });
            setFlightResults(response.data.data)
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false)
            console.error('Error searching for flights:', error);
        }
    };

    return (
        <>
            <Form onSubmit={handleSubmit(onSubmit)} className="flight-search-form">
                <Row className="mb-3 align-items-center">
                    <Col sm={12} md={4} lg={3}>
                        <Form.Group>
                            <Form.Control as="select" {...register('tripType')} className="round-trip">
                                <option value="roundTrip">Round Trip</option>
                                <option value="oneWay">One Way</option>
                                <option value="multiCity">Multi-city</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col sm={12} md={1}>
                        <DropdownButton id="dropdown-basic-button" title={<FaUser/>}>
                            <Dropdown.ItemText>
                                Adults{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('adults', 'decrease')}>-</Button>{' '}
                                {" "} {passengers.adults}{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('adults', 'increase')}>+</Button>
                            </Dropdown.ItemText>
                            <Dropdown.ItemText>
                                Children{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('children', 'decrease')}>-</Button>{' '}
                                {" "} {passengers.children}{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('children', 'increase')}>+</Button>
                            </Dropdown.ItemText>
                            <Dropdown.ItemText>
                                Infants{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('infants', 'decrease')}>-</Button>{' '}
                                {" "} {passengers.infants}{" "}
                                <Button variant="outline-secondary" size="sm"
                                        onClick={() => handlePassengerChange('infants', 'increase')}>+</Button>
                            </Dropdown.ItemText>
                        </DropdownButton>
                    </Col>
                    <Col sm={12} md={4} lg={3}>
                        <Form.Group>
                            <Form.Control as="select" {...register('classType')} className="class-type">
                                <option value="economy">Economy</option>
                                <option value="premium_economy">Premium Economy</option>
                                <option value="business">Business</option>
                                <option value="first">First</option>
                            </Form.Control>
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col sm={6} md={6} lg={watch("tripType") === "roundTrip" ? 3 : 4}>
                        <Form.Group className="position-relative mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Where from?"
                                {...register('from', {required: true})}
                            />
                        </Form.Group>
                    </Col>
                    <Col sm={6} md={6} lg={watch("tripType") === "roundTrip" ? 3 : 4}>
                        <Form.Group className="position-relative mb-3">
                            <Form.Control
                                type="text"
                                placeholder="Where to?"
                                {...register('to', {required: true})}
                            />
                        </Form.Group>
                    </Col>
                    <Col
                        sm={watch("tripType") === "roundTrip" ? 6 : 12}
                        md={watch("tripType") === "roundTrip" ? 6 : 12}
                        lg={watch("tripType") === "roundTrip" ? 3 : 4}>
                        <Form.Group className="position-relative mb-3">
                            <Form.Control
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                {...register('departureDate', {required: true})}
                            />
                        </Form.Group>
                    </Col>
                    {watch("tripType") === "roundTrip" && (
                        <Col sm={6} md={6} lg={3}>
                            <Form.Group className="position-relative mb-3">
                                <Form.Control
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    {...register('returnDate')}
                                />
                            </Form.Group>
                        </Col>
                    )}
                </Row>
                <Row className="mt-2 align-items-center justify-content-center submit-btn">
                    <Col sm={6} md={4} lg={3}>
                        <Button type="submit" variant="primary" className="search-btn" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <IoMdSearch size={21}/>
                                    Search
                                </>
                            )}
                        </Button>
                    </Col>
                </Row>
            </Form>
            <div className="container">
                {flightResults && flightResults?.itineraries.length > 0
                    ? (
                        <div className="flight-results-container">
                            <div className="flight-cards">
                                {flightResults?.itineraries?.map((flight, index) =>
                                    <div key={index}
                                         className={showMoreList[index] ? "flight-card-more" : "flight-card-short"}>
                                        <div className="airline-info">
                                            <img
                                                src={flight.legs[0].carriers?.marketing[0]?.logoUrl}
                                                alt={`${flight.legs[0].carriers?.marketing[0]?.name} logo`}
                                                className="airline-logo"
                                            />
                                            <p className="airline-name">
                                                {flight.legs[0].carriers?.marketing[0]?.name}
                                            </p>
                                        </div>
                                        {showMoreList[index] ? (
                                            <>
                                                <p><strong>Flight Number:</strong> {flight.legs[0].id}</p>
                                                <p>
                                                    <strong>Departure:</strong> {new Date(flight.legs[0]?.departure).toLocaleString()}
                                                </p>
                                                <p>
                                                    <strong>Arrival:</strong> {new Date(flight.legs[0]?.arrival).toLocaleString()}
                                                </p>
                                                <p>
                                                    <strong>From:</strong> {flight.legs[0]?.origin?.name} ({flight.legs[0]?.origin?.displayCode})
                                                </p>
                                                <p>
                                                    <strong>To:</strong> {flight.legs[0]?.destination?.name} ({flight.legs[0]?.destination?.displayCode})
                                                </p>
                                                <p>
                                                    <strong>Duration:</strong> {flight.legs[0]?.durationInMinutes} minutes
                                                </p>
                                                <p>
                                                    <strong>Price:</strong> {flight.price?.formatted}
                                                </p>
                                                <div className="show-less-div">
                                                    <FaChevronUp onClick={() => toggleMoreInfo(index)}/>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div>
                                                    <p>{flight.legs[0]?.durationInMinutes} minutes</p>
                                                    <p>{flight.legs[0]?.origin?.displayCode} - {flight.legs[0]?.destination?.displayCode}</p>
                                                </div>
                                                <div>
                                                    <p>{flight.price?.formatted}</p>
                                                </div>
                                                <div className="show-more-div">
                                                    <FaChevronDown onClick={() => toggleMoreInfo(index)}/>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>)
                    : flightResults && flightResults?.itineraries.length === 0 &&
                    (
                        <div className="no-flight-container">
                            <div className="image-container">
                                <img
                                    src={flightResults?.destinationImageUrl}
                                    alt="No flights available"
                                    className="no-flights-image"
                                />
                                <p className="no-flights-text">No Flights Available</p>
                            </div>
                        </div>
                    )
                }
            </div>
        </>
    );
};

export default FlightSearchForm;
